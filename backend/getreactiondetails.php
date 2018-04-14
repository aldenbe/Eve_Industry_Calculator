<?php
include "./connect.php";
include "./utils.php";
$request = json_decode(file_get_contents('php://input'), TRUE);
$result;
$selectedReaction = $request["selectedReaction"];
$reaction = array();


$reactionDetailsSelect =
"SELECT time as rawProductionTime, productTypeID, quantity
FROM industryActivity
JOIN industryActivityProducts ON industryActivity.typeID = industryActivityProducts.typeID
Where industryActivity.typeID = ?";
if($stmt = $conn->prepare($reactionDetailsSelect)){
  $stmt->bind_param("s", $selectedReaction);
  $stmt->execute();
  $reaction = fetch($stmt);
  $reaction[0]['typeID'] = $selectedReaction;
  echo(json_encode($reaction[0]));
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
