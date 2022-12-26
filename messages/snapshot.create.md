# summary

create a snapshot of a scratch org

# description

create a snapshot of a scratch org
A snapshot is a point-in-time copy of a scratch org. The copy is stored in Salesforce and referenced by its unique name in a scratch org definition file.

Use "sfdx force:org:snapshot:get" to get details, including status, about a snapshot creation request.

To create a scratch org from a snapshot, include the "snapshot" entry (instead of "edition") in the scratch org definition file and set it to the name of the snapshot. Then use "sfdx force:org:create" to create the scratch org.

# examples

- Create a snapshot called "Dependencies" using the source scratch org ID:

- $ sfdx force:org:snapshot:create --sourceorg 00Dxx0000000000 --snapshotname Dependencies --description 'Contains PackageA v1.1.0'

- Create a snapshot called "NightlyBranch" using the source scratch org username:

- $ sfdx force:org:snapshot:create -o myuser@myorg -n NightlyBranch -d 'Contains PkgA v2.1.0 and PkgB 3.3.0'

# flags.snapshotname

unique name of snapshot

# flags.description

description of snapshot

# flags.sourceorg

ID or locally authenticated username or alias of scratch org to snapshot

# flagsLong.snapshotname

The unique name of the snapshot. Use this name to create scratch orgs from the snapshot.

# flagsLong.description

A description of the snapshot. Use this description to document the contents of the snapshot.
We suggest that you include a reference point, such as a version control system tag or commit ID.'

# flagsLong.sourceorg

The org ID, or a locally authenticated username or alias, of the scratch org to snapshot.
