<?php
include "./connect.php";
include "./utils.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
$selectedBlueprint = $request["selectedBlueprint"];
$materials = array();
$selectedMaterialTypeID;

$blueprintMaterialSelect =
  "SELECT materialTypeID, quantity, typeName, volume
  FROM industryActivityMaterials
  JOIN invTypes ON materialTypeID = invTypes.typeID
  WHERE industryActivityMaterials.typeID = ?
  AND activityID = 1";

$blueprintComponentMaterialSelect =
  "SELECT materialTypeID, industryActivityMaterials.quantity, typeName, volume
  FROM industryActivityProducts
  JOIN industryActivityMaterials ON industryActivityMaterials.typeID = industryActivityProducts.typeID
  JOIN invTypes ON materialTypeID = invTypes.typeID
  WHERE industryActivityProducts.productTypeID = ?
  AND industryActivityProducts.activityID = 1
  AND industryActivityMaterials.activityID = 1";

$blueprintComponentDetailSelect =
  "SELECT TIME AS rawBuildTime, productTypeID, quantity, maxProductionLimit, industryBlueprints.typeID
  FROM industryActivity
  JOIN industryActivityProducts ON industryActivity.typeID = industryActivityProducts.typeID
  JOIN industryBlueprints ON industryActivity.typeID = industryBlueprints.typeID
  WHERE industryActivity.activityID = 1
  AND industryActivityProducts.productTypeID = ?";

if($materialSelectStatement = $conn->prepare($blueprintMaterialSelect)){
  $materialSelectStatement->bind_param("s", $selectedBlueprint);
  $materialSelectStatement->execute();
  $materials = fetch($materialSelectStatement);
  /* nice and simple, but get_result isn't supported by some hosting providers
  if($result = $stmt->get_result()){
    while($row = $result->fetch_assoc()){
      $row['costPerItem'] = '0';
      $materials[] = $row;
    }
  }*/

  $componentMaterialSelectStatement = $conn->prepare($blueprintComponentMaterialSelect);
  $componentMaterialSelectStatement->bind_param("s", $selectedMaterialTypeID);
  $componentDetailsSelectStatement = $conn->prepare($blueprintComponentDetailSelect);
  $componentDetailsSelectStatement->bind_param("s", $selectedMaterialTypeID);

  foreach($materials as $key => $material){
    $selectedMaterialTypeID = $material['materialTypeID'];
    $componentMaterialSelectStatement->execute();
    $componentMaterials = fetch($componentMaterialSelectStatement);
    $materials[$key]['buildComponent'] = false;
    if(!empty($componentMaterials)){
      $materials[$key]['materialEfficiency'] = 0;
      $materials[$key]['timeEfficiency'] = 0;
      $materials[$key]['componentMaterials'] = $componentMaterials;
      $componentDetailsSelectStatement->execute();
      $componentDetails = fetch($componentDetailsSelectStatement);
      $materials[$key]['componentDetails'] = $componentDetails[0];
    }
  }


echo(json_encode($materials));

} else {
  echo(json_encode($conn->error_list));
}


$conn->close();
