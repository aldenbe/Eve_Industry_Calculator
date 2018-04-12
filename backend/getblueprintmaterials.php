<?php
include "./connect.php";
include "./fetch.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
$selectedBlueprint = $request["selectedBlueprint"];
$materials = array();
function utf8ize($d) {
    if (is_array($d)) {
        foreach ($d as $k => $v) {
            $d[$k] = utf8ize($v);
        }
    } else if (is_string ($d)) {
        return utf8_encode($d);
    }
    return $d;
}
$blueprintMaterialSelect = "SELECT materialTypeID, quantity, typeName, volume From industryActivityMaterials
JOIN invTypes ON materialTypeID = invTypes.typeID
WHERE industryActivityMaterials.typeID = ?
AND activityID = 1";
if($stmt = $conn->prepare($blueprintMaterialSelect)){
  $stmt->bind_param("s", $selectedBlueprint);
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
