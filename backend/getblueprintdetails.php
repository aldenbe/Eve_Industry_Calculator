<?php
include "./connect.php";
include "./fetch.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
$selectedBlueprint = $request["selectedBlueprint"];
$blueprint = array();

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
$blueprintDetailsSelect =
"SELECT time as rawBuildTime, productTypeID, quantity, maxProductionLimit
FROM industryActivity
JOIN industryActivityProducts on industryActivity.typeID = industryActivityProducts.typeID
JOIN industryBlueprints on industryActivity.typeID = industryBlueprints.typeID
WHERE industryActivity.activityID = 1
AND industryActivity.typeID = ?";
if($stmt = $conn->prepare($blueprintDetailsSelect)){
  $stmt->bind_param("s", $selectedBlueprint);
  $stmt->execute();
  $blueprint = fetch($stmt);
  $blueprint[0]['typeID'] = $selectedBlueprint;
  echo(json_encode($blueprint[0]));
  /*
  if($result = $stmt->get_result()){
    $row = $result->fetch_assoc();
    $blueprint->rawBuildTime = $row["time"];
    $blueprint->productTypeID = $row["productTypeID"];
    $blueprint->quantity = $row["quantity"];
    $blueprint->maxProductionLimit = $row["maxProductionLimit"];
    echo(json_encode($blueprint));
  } else {
    echo(json_encode($result->error));
  }*/

} else {
  echo(json_encode($conn->error_list));
}


$conn->close();
