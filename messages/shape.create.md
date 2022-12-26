# NoCrudAccessCreateShape

Can't create org shape. Contact the org admin to grant you access to the ShapeRepresentation object. Then try again.

# success

Successfully created org shape for %s.

# shape_create_failed

Error creating scratch definition file. Please contact Salesforce support.

# summary

Create a scratch org configuration (shape) based on the specified source org

# description

Create a scratch org configuration (shape) based on the specified source org.

# examples

- $ sfdx force:org:shape:create -u me@my.org

- $ sfdx force:org:shape:create -u me@my.org --json --loglevel debug

# ShapeRepresentationNoAccess

The org needs to be enabled for org shape before one can be created. %s
