# summary

Delete a scratch org snapshot.

# description

Dev Hub admins can delete any snapshot, while users can delete only their own unless a Dev Hub admin gives the user Modify All permissions.

# examples

- Delete a snapshot from the default Dev Hub using the snapshot ID:

  <%= config.bin %> <%= command.id %> --snapshot 0Oo...

- Delete a snapshot from the specified Dev Hub using the snapshot name:

  <%= config.bin %> <%= command.id %> --snapshot BaseSnapshot --target-dev-hub SnapshotDevHub

# flags.snapshot.summary

Name or ID of snapshot to delete.

# flags.snapshot.description

The IDs of scratch org snapshots start with 0Oo.

# success

Successfully deleted snapshot %s.
