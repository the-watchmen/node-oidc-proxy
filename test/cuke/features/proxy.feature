Feature: proxy

  Background:
    Given the following records exist for resource "widgets":
    """
    [
      {
        name: 'widget-1'
      },
      {
        name: 'widget-2'
      }
    ]
    """

  Scenario: authenticate and call
    When we authenticate with user "user-1" and password "s3cret" and call "/widgets"
    Then our HTTP response should have status code 200
    And our HTTP response should be like:
    """
    [
      {
        name: 'widget-1'
      },
      {
        name: 'widget-2'
      }
    ]
    """
