# summary

Delete all org shapes for a target org.

# description

A source org can have only one active org shape. If you try to create an org shape for a source org that already has one, the previous shape is marked inactive and replaced by a new active shape. If you don’t want to create scratch orgs based on this shape, you can delete the org shape.

# examples

- Delete all org shapes for the source org with alias SourceOrg:

  <%= config.bin %> <%= command.id %> --target-org SourceOrg

- Delete all org shapes without prompting:

  <%= config.bin %> <%= command.id %> --target-org SourceOrg --no-prompt

# flags.no-prompt.summary

Don't prompt for confirmation.

# noAccess

The org with name: %s needs to be enabled for org shape before shapes can be deleted.

# deleteCommandYesNo

Delete shapes for org with name: %s? Are you sure (y/n)?

# humanSuccess

Successfully deleted org shape for %s.

# noShapesHumanSuccess

Can't delete org shape. No org shape found for org %s.
