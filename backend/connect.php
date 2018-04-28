<?php
require('securevariables.php');

// Create connection
$conn = new mysqli(SERVERNAME, USERNAME, PASSWORD, DATABASE);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
