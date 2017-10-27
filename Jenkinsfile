#!/usr/bin/groovy

def pipeline = new com.aetna.pds.Pipeline()
pipeline.nsEnvVars()

podTemplate(
  label: 'dynamic-slave',
  name: 'k8s-jnlp',
  containers: [
    containerTemplate(
      name: 'jnlp',
      image: 'jenkinsci/jnlp-slave:3.10-1-alpine',
      args: '${computer.jnlpmac} ${computer.name}',
      workingDir: '/home/jenkins',
      resourceRequestCpu: '200m',
      resourceLimitCpu: '200m',
      resourceRequestMemory: '256Mi',
      resourceLimitMemory: '256Mi'
    ),
    containerTemplate(name: 'docker', image: 'docker:1.12.6', privileged: true, command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'node', image: 'node:8-alpine', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'helm-template', image: 'cromark/k8s-helm:v2.5.1', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'kubectl', image: 'lachlanevenson/k8s-kubectl:v1.7.3', command: 'cat', ttyEnabled: true),
    containerTemplate(
      name: 'mysql',
      image: 'mysql:5.7',
      ttyEnabled: true,
      privileged: false,
      alwaysPullImage: false,
      workingDir: '/home/jenkins',
      resourceRequestCpu: '50m',
      resourceLimitCpu: '100m',
      resourceRequestMemory: '100Mi',
      resourceLimitMemory: '200Mi',
      envVars: [
        containerEnvVar(key: 'MYSQL_ROOT_PASSWORD', value: 'password'),
        containerEnvVar(key: 'MYSQL_DATABASE', value: 'udx-auto'),
      ],
      ports: [portMapping(name: 'mysql', containerPort: 3306, hostPort: 3306)]
    )
  ],
  volumes:[
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')
  ]
){
  properties(
    [
      buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10')),
      pipelineTriggers([])
    ]
  )

  node ('dynamic-slave') {
    try {
      checkout scm

      pipeline.gitEnvVars()

      sh 'env | sort'

      stage ('install') {
        container('node') {
          configFileProvider([configFile(fileId: '9d9c9f5f-6564-4709-bf5e-3349271d5a67', targetLocation: '.npmrc')]) {
            echo 'running yarn...'
            sh 'yarn'
          }
        }
      }

      stage ('test') {
        container('node') {
          echo 'running yarn test...'
          sh 'DB_URL=mysql://root:password@${HOSTNAME}/udx-auto yarn test'
        }
      }

      stage ('build') {
        container('node') {
          echo 'running yarn build...'
          sh 'yarn build'
        }
      }

      stage ('publish container') {
        def image="${REGISTRY_URI}/${REGISTRY_USER}/${NS_PROJECT}:${GIT_SHA}"

        echo "image=${image}"

        container('docker') {
          withCredentials([string(credentialsId: '8a7aee8f-524e-42ba-b93e-3a00274f329e', variable: 'PASSWORD')]) {
              sh """
                docker login -u="${REGISTRY_USER}" -p="${PASSWORD}" "${REGISTRY_URI}"
                docker build -f docker/Dockerfile --rm -t ${image} .
                docker push ${image}
              """
          }
        }
      }

      stage ('helm-expand') {
        def annotations =
        """
        {
          "annotations": {
            "aetna.com/org": "${NS_ORG}",
            "aetna.com/build.project": "${NS_PROJECT}",
            "aetna.com/build.number": $BUILD_NUMBER,
            "aetna.com/ci.sha": "${GIT_SHA}"
          }
        }
        """
        container('helm-template') {
          writeFile file: 'meta.yaml', text: annotations
          sh "cat meta.yaml"
          // hardcoding to values.lab.yml for now
          sh "HELM_PLUGIN=/root/.helm/plugins helm template -f k8s/values.lab.yml -f meta.yaml --set name=${NS_PROJECT},image.repository=$REGISTRY_URI/$REGISTRY_USER/${NS_PROJECT},image.tag=${GIT_SHA} k8s/helm > .k8s.merged"
          sh "cat .k8s.merged"
        }
      }

      stage ('k8s') {
        container('kubectl') {
          sh "kubectl apply --dry-run -f .k8s.merged"
          sh "kubectl apply -f .k8s.merged"
        }
      }

      if(currentBuild.result == null) {
        currentBuild.result = "SUCCESS" // sets the ordinal as 0 and boolean to true
      }
    }
    finally {
      pipeline.finish()
    }
  }
}
