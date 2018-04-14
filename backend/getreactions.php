<?php
include "./connect.php";
include "./utils.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
//FIXME: why isn't it reading post right sometimes?
$reactionGroups = [1888, 1889, 1890];
switch ($request["selectedReactionType"]){
  case "all":
    $reactionGroups = [1888, 1889, 1890];
    break;
  case "composite":
    $reactionGroups = [1888];
    break;
  case "polymer":
    $reactionGroups = [1889];
    break;
  case "biochemical":
    $reactionGroups = [1890];
    break;
}
$reactionSelect =
"SELECT DISTINCT typeName as 'text', typeID as 'value'
  FROM invTypes
  WHERE groupID in (" . implode(',', $reactionGroups) . ")
  ORDER BY REPLACE(typeName, '\'', '')";
if($result = $conn->query($reactionSelect)){
  $rows = array();
  while($row = $result->fetch_assoc()){
    $rows[] = $row;
  }
  echo(json_encode(utf8ize($rows)));
} else {
  echo(json_encode($result->error));
}
$conn->close();
