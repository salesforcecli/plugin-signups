# summary

Create a scratch org configuration (shape) based on the specified source org.

# description

Scratch org shapes mimic the baseline setup (features, limits, edition, and Metadata API settings) of a source org without the extraneous data and metadata.

Run "<%= config.bin %> org list shape" to view the available org shapes and their IDs.

To create a scratch org from an org shape, include the "sourceOrg" property in the scratch org definition file and set it to the org ID of the source org. Then create a scratch org with the "<%= config.bin %> force:org:create" command.

# examples

- Create an org shape for the source org with alias SourceOrg:

  <%= config.bin %> <%= command.id %> --target-org SourceOrg

# ShapeRepresentationNoAccess

The org needs to be enabled for org shape before one can be created. %s

# NoCrudAccessCreateShape

Can't create org shape. Contact the org admin to grant you access to the ShapeRepresentation object. Then try again.

# success

Successfully created org shape for %s.

# ShapeCreateFailed

Error creating scratch definition file. Please contact Salesforce support.
