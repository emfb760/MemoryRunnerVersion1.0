<?php

$difficulty = $_POST["difficulty"];

$mysqli = new mysqli("localhost", "root", "", "memrun");

if( $difficulty == 0 )
	$query = "SELECT * FROM high_scores_easy ORDER BY score DESC, id ASC LIMIT 3;";
else
	$query = "SELECT * FROM high_scores_hard ORDER BY score DESC, id ASC LIMIT 3;";
	
$result = $mysqli->query($query);

$output = array();

while($row = $result->fetch_assoc()) {
	$output[] = array("name"=>strtoupper($row["name"]), "score"=>$row["score"]);
}

echo json_encode($output);

?>