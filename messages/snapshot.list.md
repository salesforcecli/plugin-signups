# summary

list scratch org snapshots

# description

list scratch org snapshots
You can view all the snapshots in a Dev Hub that you have access to. If you’re an admin, you can see all snapshots associated with the Dev Hub org. If you’re a user, you can see only your snapshots unless a Dev Hub admin gives you View All permissions.

To create a snapshot, use the "sfdx force:org:snapshot:create" command. To get details about a snapshot request, use "sfdx force:org:snapshot:get".

# examples

- List snapshots in the default Dev Hub:

- $ sfdx force:org:snapshot:list

- List snapshots in the Dev Hub with the specified username:

- $ sfdx force:org:snapshot:list -v OtherDevHub@example.com