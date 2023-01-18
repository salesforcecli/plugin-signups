# summary

List all org shapes you’ve created.

# description

The output includes the alias, username, and ID of the source org, the status of the org shape creation, and more. Use the org ID to update your scratch org configuration file so you can create a scratch org based on this org shape.

# examples

- List all org shapes you've created:

  <%= config.bin %> <%= command.id %>

- List all org shapes in JSON format and write the output to a file:

  <%= config.bin %> <%= command.id %> --json > tmp/MyOrgShapeList.json

# verbose

List more information about each org shape.

# noOrgShapes

No org shapes found.

# noAuthFound

No authenticated orgs found.
