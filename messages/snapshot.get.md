# summary

get details about a scratch org snapshot

# description

get details about a scratch org snapshot
Snapshot creation can take a while. Use this command with the snapshot name or ID to check its creation status. Once the status changes to Active, you can use the snapshot to create scratch orgs.

To create a snapshot, use the "sfdx force:org:snapshot:create" command. To retrieve a list of all snapshots, use "sfdx force:org:snapshot:list".

# examples

- Get snapshot details using its ID:

- $ sfdx force:org:snapshot:get --snapshot 0Oo...

- Get snapshot details using its name:

- $ sfdx force:org:snapshot:get -s Dependencies

# flags.snapshot

name or ID of snapshot to retrieve

# flagsLong.snapshot

The name or ID (starts with 0Oo) of the snapshot to retrieve.