# summary

Get details about a scratch org snapshot.

# description

Snapshot creation can take a while. Use this command with the snapshot name or ID to check its creation status. After the status changes to Active, you can use the snapshot to create scratch orgs.

To create a snapshot, use the "<%= config.bin %> org create snapshot" command. To retrieve a list of all snapshots, use "<%= config.bin %> org list snapshot".

# examples

- Get snapshot details using its ID and the default Dev Hub org:

  <%= config.bin %> <%= command.id %> --snapshot 0Oo...

- Get snapshot details using its name from a Dev Hub org with alias SnapshotDevHub:

  <%= config.bin %> <%= command.id %> --snapshot Dependencies --target-dev-hub SnapshotDevHub

# flags.snapshot.summary

Name or ID of snapshot to retrieve.

# flags.snapshot.description

The IDs of scratch org snapshots start with 0Oo.
