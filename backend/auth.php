<?php
require('Client.php');
require('GrantType/IGrantType.php');
require('GrantType/AuthorizationCode.php');
require('GrantType/RefreshToken.php');
require('securevariables.php');
$clientID;
$clientSecret;

if($_SERVER['HTTP_HOST'] == 'localhost'){
  $clientID = DEV_CLIENT_ID;
  $clientSecret = DEV_CLIENT_SECRET;
} elseif(strpos($_SERVER['HTTP_HOST'], 'www') !== false) {
  $clientID = WWW_CLIENT_ID;
  $clientSecret = WWW_CLIENT_SECRET;
} else {
  $clientID = CLIENT_ID;
  $clientSecret = CLIENT_SECRET;
}
$request = json_decode(file_get_contents('php://input'), TRUE);




//set this page as the redirect uri
$redirectURI = "http://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}";
const AUTHORIZATION_ENDPOINT = 'https://login.eveonline.com/oauth/authorize';
const TOKEN_ENDPOINT         = 'https://login.eveonline.com/oauth/token';

$client = new OAuth2\Client($clientID, $clientSecret);
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  die();
}
if(isset($request)){
  //handle getting refresh tokens
  $params = array('refresh_token' => $request['refreshToken']);
  ob_start();
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'refresh_token', $params);
  ob_end_clean();
  echo(json_encode($response['result']));
  die('');
}
if (!isset($_GET['code']))
{
  //handle getting auth code

  //only serve requests from this domain regardless of cross origin settings
  //also extract host name and send token replies there for simplicity of switching between dev and production environments
  $server = $_SERVER['HTTP_HOST'];
  $pattern = "~(^https?://{$server}(:\d+)?/(eic/)?).*$~";
  if(preg_match($pattern, $_SERVER['HTTP_REFERER'], $match)){
    $finalRedirectBaseURI = $match[1] . 'auth.html?access_token=';
    session_start();
    $_SESSION['finalRedirectBaseURI'] = $finalRedirectBaseURI;
    $scopes;
    if ($server == 'eic') {
      $scopes = "esi-search.search_structures.v1 esi-universe.read_structures.v1 esi-markets.structure_markets.v1";
    } elseif ($server == 'eveic.com' || $server == 'www.eveic.com') {
      $scopes = "esi-search.search_structures.v1 esi-universe.read_structures.v1 esi-markets.structure_markets.v1";
    } else {
      $scopes = "publicData esi-calendar.respond_calendar_events.v1 esi-calendar.read_calendar_events.v1 esi-location.read_location.v1 esi-location.read_ship_type.v1 esi-mail.organize_mail.v1 esi-mail.read_mail.v1 esi-skills.read_skills.v1 esi-skills.read_skillqueue.v1 esi-wallet.read_character_wallet.v1 esi-wallet.read_corporation_wallet.v1 esi-search.search_structures.v1 esi-clones.read_clones.v1 esi-characters.read_contacts.v1 esi-universe.read_structures.v1 esi-bookmarks.read_character_bookmarks.v1 esi-killmails.read_killmails.v1 esi-corporations.read_corporation_membership.v1 esi-assets.read_assets.v1 esi-planets.manage_planets.v1 esi-fleets.read_fleet.v1 esi-fleets.write_fleet.v1 esi-ui.open_window.v1 esi-ui.write_waypoint.v1 esi-characters.write_contacts.v1 esi-fittings.read_fittings.v1 esi-fittings.write_fittings.v1 esi-markets.structure_markets.v1 esi-corporations.read_structures.v1 esi-corporations.write_structures.v1 esi-characters.read_loyalty.v1 esi-characters.read_opportunities.v1 esi-characters.read_chat_channels.v1 esi-characters.read_medals.v1 esi-characters.read_standings.v1 esi-characters.read_agents_research.v1 esi-industry.read_character_jobs.v1 esi-markets.read_character_orders.v1 esi-characters.read_blueprints.v1 esi-characters.read_corporation_roles.v1 esi-location.read_online.v1 esi-contracts.read_character_contracts.v1 esi-clones.read_implants.v1 esi-characters.read_fatigue.v1 esi-killmails.read_corporation_killmails.v1 esi-corporations.track_members.v1 esi-wallet.read_corporation_wallets.v1 esi-characters.read_notifications.v1 esi-corporations.read_divisions.v1 esi-corporations.read_contacts.v1 esi-assets.read_corporation_assets.v1 esi-corporations.read_titles.v1 esi-corporations.read_blueprints.v1 esi-bookmarks.read_corporation_bookmarks.v1 esi-contracts.read_corporation_contracts.v1 esi-corporations.read_standings.v1 esi-corporations.read_starbases.v1 esi-industry.read_corporation_jobs.v1 esi-markets.read_corporation_orders.v1 esi-corporations.read_container_logs.v1 esi-industry.read_character_mining.v1 esi-industry.read_corporation_mining.v1 esi-planets.read_customs_offices.v1 esi-corporations.read_facilities.v1 esi-corporations.read_medals.v1 esi-characters.read_titles.v1 esi-alliances.read_contacts.v1 esi-characters.read_fw_stats.v1 esi-corporations.read_fw_stats.v1 esi-corporations.read_outposts.v1 esi-characterstats.read.v1";
    }
    $extra_parameters = array('scope' => $scopes);
    ob_start();
    $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, $redirectURI, $extra_parameters);
    ob_end_clean();
    header('Location: ' . $auth_url);
    die('Redirect');
  } else {
    die();
  }
}
else
{
  //handle getting token
  session_start();
  $params = array('code' => $_GET['code'], 'redirect_uri' => $redirectURI, 'scope' => 'corporationContactsRead ');
  ob_start();
  $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
  ob_end_clean();
  $redirectURI = $_SESSION['finalRedirectBaseURI'] . $response['result']['access_token'] . "&expires_in=" . $response['result']['expires_in'] . "&refresh_token=" . $response['result']['refresh_token'];
  header("location: " . $redirectURI);
  session_unset();
  session_destroy();
  die('Redirect');
}
