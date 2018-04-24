<!DOCTYPE html>
<html>
  <head>
    <title>Image List</title>
    <style>
.container {
  width: 100px;
}

.container img {
   object-fit: contain;
   max-width: 100%;
   max-height: 100%;
   width: auto;
   height: auto;
}
</style>
  </head>
  <body>
    <p class="error">{{errmsg}}</p>
    <form enctype="multipart/form-data" method="post" action="/HideSuccess" id="usrform">
<div class="container">
 {{#images}}
    <p >
      <strong>{{id}}</strong>
      <img src={{URL}}></img>
      <input type="radio" name=image value={{hideURL}} id={{id}}><br>
    </p>
    {{/images}}
</div>
    Upload File <input type="file" name="msg"><br>
Message<textarea name="msg" form="usrform"></textarea>
    <br>
<input type="submit" value="Submit">

</form>
    {{>footer}}
  </body>
</html>
