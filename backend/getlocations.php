<?php
include "./connect.php";
include "./utils.php";
$locations = array();
$ignoredRegions = [10000004, 10000017, 10000019, 11000001, 11000002, 11000003, 11000004, 11000005, 11000006, 11000007, 11000008,11000009,  11000010, 11000011, 11000012, 11000013, 11000014, 11000015, 11000016, 11000017, 11000018, 11000019, 11000020, 11000021, 11000022, 11000023, 11000024, 11000025, 11000026, 11000027, 11000028, 11000029, 11000030, 11000032, 11000033];

/*$locationSelect =
  "SELECT DISTINCT solarSystemID, mapSolarSystems.regionID, regionName, solarSystemName FROM mapRegions
  Join mapSolarSystems on mapSolarSystems.regionID = mapRegions.regionID
  WHERE securityClass IS NOT NULL
  ORDER BY mapRegions.regionName ASC";
if($result = $conn->query($locationSelect)){
  while($row = $result->fetch_assoc()){

    $locations[$row['regionID']]['systems'] = array();
    $locations[$row['regionID']]['systems'][$row['solarSystemID']] = array();
    $locations[$row['regionID']]['systems'][$row['solarSystemID']]['solarSystemName'] = $row['solarSystemName'];
    $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'] = array();
  }*/
  //FIXME: securityClass IS NOT NULL isn't a valid means of eliminating jove / WH also elimantes desired getRegions
  //also need to allow thera
  //really rather not have to resort to just using a static solution with no procedural equivalent, but if i have to
  $stationSelect =
    "SELECT mapRegions.regionID, stationID, corporationID, mapSolarSystems.solarSystemID, stationName, staStations.security, regionName, solarSystemName
    FROM mapRegions
    JOIN mapSolarSystems on mapRegions.regionID = mapSolarSystems.regionID
    LEFT JOIN staStations on staStations.solarSystemID = mapSolarSystems.solarSystemID
    WHERE mapRegions.regionID NOT IN (" . implode(',', $ignoredRegions) . ")";
  if($result = $conn->query($stationSelect)){
    while($row = $result->fetch_assoc()){
      if(!array_key_exists($row['regionID'], $locations)){
        $locations[$row['regionID']]['regionName'] = $row['regionName'];
      }
      if(!isset($locations[$row['regionID']]['systems'][$row['solarSystemID']])){
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['solarSystemName'] = $row['solarSystemName'];
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'] = array();
      }
      if(isset($row['stationID'])){
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'][$row['stationID']] = array();
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'][$row['stationID']]['stationName'] = $row['stationName'];
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'][$row['stationID']]['security'] = $row['security'];
        $locations[$row['regionID']]['systems'][$row['solarSystemID']]['stations'][$row['stationID']]['corporationID'] = $row['corporationID'];
      }

    }
    echo(json_encode(utf8ize($locations)));

} else {
  echo(json_encode($conn->error_list));
}
$conn->close();
