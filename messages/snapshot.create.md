# summary

Create a snapshot of a scratch org.

# description

A snapshot is a point-in-time copy of a scratch org. The copy is referenced by its unique name in a scratch org definition file.

Use "<%= config.bin %> org get snapshot" to get details, including status, about a snapshot creation request.

To create a scratch org from a snapshot, include the "snapshot" option (instead of "edition") in the scratch org definition file and set it to the name of the snapshot. Then use "<%= config.bin %> force:org:create" to create the scratch org.

# examples

- Create a snapshot called "Dependencies" using the source scratch org ID and your default Dev Hub org:

  <%= config.bin %> <%= command.id %> --source-org 00Dxx0000000000 --name Dependencies --description 'Contains PackageA v1.1.0'

- Create a snapshot called "NightlyBranch" using the source scratch org username and a Dev Hub org with alias NightlyDevHub:

  <%= config.bin %> <%= command.id %> --source-org myuser@myorg --name NightlyBranch --description 'Contains PkgA v2.1.0 and PkgB 3.3.0' --target-dev-hub NightlyDevHub

# flags.name.summary

Unique name of snapshot.

# flags.description.summary

Description of snapshot.

# flags.source-org.summary

ID or locally authenticated username or alias of scratch org to snapshot.

# flags.description.description

Use this description to document the contents of the snapshot. We suggest that you include a reference point, such as a version control system tag or commit ID.
