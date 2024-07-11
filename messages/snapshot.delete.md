# summary

Delete a scratch org snapshot.

# description

Dev Hub admins can delete any snapshot. Users can delete only their own snapshots, unless a Dev Hub admin gives the user Modify All permission, which works only with the Salesforce license.

# examples

- Delete a snapshot from the default Dev Hub using the snapshot ID:

  <%= config.bin %> <%= command.id %> --snapshot 0Oo...

- Delete a snapshot from the specified Dev Hub using the snapshot name:

  <%= config.bin %> <%= command.id %> --snapshot BaseSnapshot --target-dev-hub SnapshotDevHub

# flags.snapshot.summary

Name or ID of snapshot to delete.

# flags.snapshot.description

The IDs of scratch org snapshots start with 0Oo.

# flags.no-prompt.summary

Don't prompt the user to confirm the deletion.

# prompt.confirm

Are you sure you want to delete the snapshot?

# success

Successfully deleted snapshot %s.
