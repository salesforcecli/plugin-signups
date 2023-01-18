# summary

List scratch org snapshots.

# description

You can view all the snapshots in a Dev Hub that you have access to. If you’re an admin, you can see all snapshots associated with the Dev Hub org. If you’re a user, you can see only your snapshots unless a Dev Hub admin gives you View All permissions.

To create a snapshot, use the "<%= config.bin %> org create snapshot" command. To get details about a snapshot request, use "<%= config.bin %> org get snapshot".

# examples

- List snapshots in the default Dev Hub:

  <%= config.bin %> <%= command.id %>

- List snapshots in the Dev Hub with alias SnapshotDevHub:

  <%= config.bin %> <%= command.id %> --target-dev-hub SnapshotDevHub
