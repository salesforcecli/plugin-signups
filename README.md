# plugin-signups

[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-signups.svg?label=@salesforce/plugin-signups)](https://www.npmjs.com/package/@salesforce/plugin-signups) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-signups.svg)](https://npmjs.org/package/@salesforce/plugin-signups) [![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/license/apache-2-0)

## Learn about the plugin-signups

Salesforce CLI plugins are based on the [oclif plugin framework](https://oclif.io/docs/introduction). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](https://github.com/forcedotcom/sfdx-dev-packages/) used by Salesforce. There is also a default circleci config using the [release management orb](https://github.com/forcedotcom/npm-release-management-orb) standards.

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is recommended to keep these tests active in your plugin, regardless if you plan to have it bundled.

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Install

```bash
sfdx plugins:install signups@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/plugin-signups

# Install the dependencies and compile
yarn install
yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev force:org:shape
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sfdx cli
sfdx plugins:link .
# To verify
sfdx plugins
```

## Commands

<!-- commands -->

- [`sf org create shape`](#sf-org-create-shape)
- [`sf org create snapshot`](#sf-org-create-snapshot)
- [`sf org delete shape`](#sf-org-delete-shape)
- [`sf org delete snapshot`](#sf-org-delete-snapshot)
- [`sf org get snapshot`](#sf-org-get-snapshot)
- [`sf org list shape`](#sf-org-list-shape)
- [`sf org list snapshot`](#sf-org-list-snapshot)

## `sf org create shape`

Create a scratch org configuration (shape) based on the specified source org.

```
USAGE
  $ sf org create shape -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a scratch org configuration (shape) based on the specified source org.

  Scratch org shapes mimic the baseline setup (features, limits, edition, and Metadata API settings) of a source org
  without the extraneous data and metadata.

  Run "sf org list shape" to view the available org shapes and their IDs.

  To create a scratch org from an org shape, include the "sourceOrg" property in the scratch org definition file and set
  it to the org ID of the source org. Then create a scratch org with the "sf org create scratch" command.

ALIASES
  $ sf force org shape create

EXAMPLES
  Create an org shape for the source org with alias SourceOrg:

    $ sf org create shape --target-org SourceOrg
```

_See code: [src/commands/org/create/shape.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/create/shape.ts)_

## `sf org create snapshot`

Create a snapshot of a scratch org.

```
USAGE
  $ sf org create snapshot -v <value> -o <value> -n <value> [--json] [--flags-dir <value>] [--api-version <value>] [-d
    <value>]

FLAGS
  -d, --description=<value>     Description of snapshot.
  -n, --name=<value>            (required) Unique name of snapshot.
  -o, --source-org=<value>      (required) ID or locally authenticated username or alias of scratch org to snapshot.
  -v, --target-dev-hub=<value>  (required) Username or alias of the Dev Hub org. Not required if the `target-dev-hub`
                                configuration variable is already set.
      --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a snapshot of a scratch org.

  A snapshot is a point-in-time copy of a scratch org. The copy is referenced by its unique name in a scratch org
  definition file.

  Use "sf org get snapshot" to get details, including status, about a snapshot creation request.

  To create a scratch org from a snapshot, include the "snapshot" option (instead of "edition") in the scratch org
  definition file and set it to the name of the snapshot. Then use "sf org create scratch" to create the scratch org.

ALIASES
  $ sf force org snapshot create

EXAMPLES
  Create a snapshot called "Dependencies" using the source scratch org ID and your default Dev Hub org:

    $ sf org create snapshot --source-org 00Dxx0000000000 --name Dependencies --description 'Contains PackageA \
      v1.1.0'

  Create a snapshot called "NightlyBranch" using the source scratch org username and a Dev Hub org with alias
  NightlyDevHub:

    $ sf org create snapshot --source-org myuser@myorg --name NightlyBranch --description 'Contains PkgA v2.1.0 and \
      PkgB 3.3.0' --target-dev-hub NightlyDevHub

FLAG DESCRIPTIONS
  -d, --description=<value>  Description of snapshot.

    Use this description to document the contents of the snapshot. We suggest that you include a reference point, such
    as a version control system tag or commit ID.
```

_See code: [src/commands/org/create/snapshot.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/create/snapshot.ts)_

## `sf org delete shape`

Delete all org shapes for a target org.

```
USAGE
  $ sf org delete shape -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-p]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -p, --no-prompt            Don't prompt for confirmation.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Delete all org shapes for a target org.

  A source org can have only one active org shape. If you try to create an org shape for a source org that already has
  one, the previous shape is marked inactive and replaced by a new active shape. If you don’t want to create scratch
  orgs based on this shape, you can delete the org shape.

ALIASES
  $ sf force org shape delete

EXAMPLES
  Delete all org shapes for the source org with alias SourceOrg:

    $ sf org delete shape --target-org SourceOrg

  Delete all org shapes without prompting:

    $ sf org delete shape --target-org SourceOrg --no-prompt
```

_See code: [src/commands/org/delete/shape.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/delete/shape.ts)_

## `sf org delete snapshot`

Delete a scratch org snapshot.

```
USAGE
  $ sf org delete snapshot -v <value> -s <value> [--json] [--flags-dir <value>] [--api-version <value>] [-p]

FLAGS
  -p, --no-prompt               Don't prompt the user to confirm the deletion.
  -s, --snapshot=<value>        (required) Name or ID of snapshot to delete.
  -v, --target-dev-hub=<value>  (required) Username or alias of the Dev Hub org. Not required if the `target-dev-hub`
                                configuration variable is already set.
      --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Delete a scratch org snapshot.

  Dev Hub admins can delete any snapshot. Users can delete only their own snapshots, unless a Dev Hub admin gives the
  user Modify All permission, which works only with the Salesforce license.

ALIASES
  $ sf force org snapshot delete

EXAMPLES
  Delete a snapshot from the default Dev Hub using the snapshot ID:

    $ sf org delete snapshot --snapshot 0Oo...

  Delete a snapshot from the specified Dev Hub using the snapshot name:

    $ sf org delete snapshot --snapshot BaseSnapshot --target-dev-hub SnapshotDevHub

FLAG DESCRIPTIONS
  -s, --snapshot=<value>  Name or ID of snapshot to delete.

    The IDs of scratch org snapshots start with 0Oo.
```

_See code: [src/commands/org/delete/snapshot.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/delete/snapshot.ts)_

## `sf org get snapshot`

Get details about a scratch org snapshot.

```
USAGE
  $ sf org get snapshot -v <value> -s <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -s, --snapshot=<value>        (required) Name or ID of snapshot to retrieve.
  -v, --target-dev-hub=<value>  (required) Username or alias of the Dev Hub org. Not required if the `target-dev-hub`
                                configuration variable is already set.
      --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Get details about a scratch org snapshot.

  Snapshot creation can take a while. Use this command with the snapshot name or ID to check its creation status. After
  the status changes to Active, you can use the snapshot to create scratch orgs.

  To create a snapshot, use the "sf org create snapshot" command. To retrieve a list of all snapshots, use "sf org list
  snapshot".

ALIASES
  $ sf force org snapshot get

EXAMPLES
  Get snapshot details using its ID and the default Dev Hub org:

    $ sf org get snapshot --snapshot 0Oo...

  Get snapshot details using its name from a Dev Hub org with alias SnapshotDevHub:

    $ sf org get snapshot --snapshot Dependencies --target-dev-hub SnapshotDevHub

FLAG DESCRIPTIONS
  -s, --snapshot=<value>  Name or ID of snapshot to retrieve.

    The IDs of scratch org snapshots start with 0Oo.
```

_See code: [src/commands/org/get/snapshot.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/get/snapshot.ts)_

## `sf org list shape`

List all org shapes you’ve created.

```
USAGE
  $ sf org list shape [--json] [--flags-dir <value>]

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  List all org shapes you’ve created.

  The output includes the alias, username, and ID of the source org, the status of the org shape creation, and more. Use
  the org ID to update your scratch org configuration file so you can create a scratch org based on this org shape.

ALIASES
  $ sf force org shape list

EXAMPLES
  List all org shapes you've created:

    $ sf org list shape

  List all org shapes in JSON format and write the output to a file:

    $ sf org list shape --json > tmp/MyOrgShapeList.json
```

_See code: [src/commands/org/list/shape.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/list/shape.ts)_

## `sf org list snapshot`

List scratch org snapshots.

```
USAGE
  $ sf org list snapshot -v <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -v, --target-dev-hub=<value>  (required) Username or alias of the Dev Hub org. Not required if the `target-dev-hub`
                                configuration variable is already set.
      --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  List scratch org snapshots.

  You can view all the snapshots in a Dev Hub that you have access to. If you’re an admin, you can see all snapshots
  associated with the Dev Hub org. If you’re a user, you can see only your snapshots unless a Dev Hub admin gives you
  View All permissions.

  To create a snapshot, use the "sf org create snapshot" command. To get details about a snapshot request, use "sf org
  get snapshot".

ALIASES
  $ sf force org snapshot list

EXAMPLES
  List snapshots in the default Dev Hub:

    $ sf org list snapshot

  List snapshots in the Dev Hub with alias SnapshotDevHub:

    $ sf org list snapshot --target-dev-hub SnapshotDevHub
```

_See code: [src/commands/org/list/snapshot.ts](https://github.com/salesforcecli/plugin-signups/blob/2.6.33/src/commands/org/list/snapshot.ts)_

<!-- commandsstop -->
