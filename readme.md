Store and retrieve objects from a mongo/meteor database.

Annotate type information on the class.

 It will store a property "className" if the class does not match the expected class.


On restoration of a document

1) If the expected type has a static function "toObject", that function is used

2) If there is a "className" property on the document, it is used to instantiate the object

3) An object of the expected class is instantiated

4) The object created is filled with the properties found on the document.

Other rules:

If a wrapped call can only cause persitent updates on their root object.

Parameters are serialized unless they have a persistence path. In that case the persistence path is used and the object is loaded once.

Todo:

	redefine what can be configured with the object retriever:

		1) the key format? (not so important but kind of nice)
		2) where objectes are retrieved from : mandatory

		add "isLocal" function to the objectRetriever and write tests for a different kind of key format

		OR remove getId function and only pass collection name and id to the getObject function (the latter is a good idea anyways)