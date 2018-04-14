<?php
include "./connect.php";
include "./utils.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
$selectedReaction = $request["selectedReaction"];
$materials = array();

$reactionMaterialSelect = "SELECT materialTypeID, quantity, typeName, volume From industryActivityMaterials
JOIN invTypes ON materialTypeID = invTypes.typeID
WHERE industryActivityMaterials.typeID = ?
AND activityID = 11";
if($stmt = $conn->prepare($reactionMaterialSelect)){
  $stmt->bind_param("s", $selectedReaction);
  $stmt->execute();


  /* nice and simple, but get_result isn't supported by godaddy
  if($result = $stmt->get_result()){
    while($row = $result->fetch_assoc()){
      $row['costPerItem'] = '0';
      $materials[] = $row;
    }
  }*/

  $materials = fetch($stmt);
  echo(json_encode($materials));

} else {
  echo(json_encode($conn->error_list));
}


$conn->close();
