# helm template

k8s manifests generated using [helm](https://github.com/kubernetes/helm) and the [helm template](https://github.com/technosophos/helm-template) plugin

```
helm template k8s/helm -f k8s/values.lab.yml --set image.tag=123
```
