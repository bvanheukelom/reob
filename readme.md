###Meteor object mapper

Omm is a library that store and retrieves objects from meteor/mongo collections. It aims to separate the logic to persist and retrive object from the business logic. It is inspired by ORMs like JPA/Hibernate or Backbone.

Here is an example:

We define two javascript classes that reference each other.

<Garden.js>
<Plant.js>


Annotate type information on the class.

 It will store a property "className" if the class does not match the expected class.


On restoration of a document

1) If the expected type has a static function "toObject", that function is used

2) If there is a "className" property on the document, it is used to instantiate the object

3) An object of the expected class is instantiated

4) The object created is filled with the properties found on the document.



