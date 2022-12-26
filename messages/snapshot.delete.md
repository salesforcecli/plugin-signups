# description

delete a scratch org snapshot
Dev Hub admins can delete any snapshot, while users can delete only theirs unless a Dev Hub admin gives the user Modify All permissions.

# examples

- Delete a snapshot from the default Dev Hub using the snapshot ID:

- $ sfdx force:org:snapshot:delete --snapshot 0Oo...

- Delete a snapshot from the specified Dev Hub using the snapshot name:

- $ sfdx force:org:snapshot:delete -s BaseSnapshot -v SnapshotDevHub

# flags.snapshot

name or ID of snapshot to delete

# flagsLong.snapshot

The name or ID (starts with 0Oo) of the snapshot to delete.

# success

Successfully deleted snapshot %s.