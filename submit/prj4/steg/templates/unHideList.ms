<!DOCTYPE html>
<html>
  <head>
    <title>Unhide Image List</title>
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
    <form method="post" action="/unHideSuccess">
<div class="container">
 {{#images}}
    <p >
      <strong>{{id}}</strong>
      <img src={{URL}}></img>
      <input type="radio" name=image value={{unhideURL}} id={{id}}><br>
    </p>
    {{/images}}
</div>
<input type="submit" value="Submit">

</form>
    {{>footer}}
  </body>
</html>
