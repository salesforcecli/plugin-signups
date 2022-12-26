# description

Delete all org shapes for a target org

# longDescription

Deletes all org shapes that you’ve created for an org using the Salesforce CLI.

# noPrompt

do not prompt for confirmation

# noPromptLong

Do not prompt for confirmation.

# noAccess

The org with name: %s needs to be enabled for org shape before shapes can be deleted.

# deleteCommandYesNo

Delete shapes for org with name: %s? Are you sure (y/n)?

# humanSuccess

Successfully deleted org shape for %s.

# noShapesHumanSuccess

Can't delete org shape. No org shape found for org %s.

# help

- $ sfdx force:org:shape:delete -u me@my.org

- $ sfdx force:org:shape:delete -u MyOrgAlias -p

- $ sfdx force:org:shape:delete -u me@my.org --json

- $ sfdx force:org:shape:delete -u me@my.org -p --json > tmp/MyOrgShapeDelete.json
