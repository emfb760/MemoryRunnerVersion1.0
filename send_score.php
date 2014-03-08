<?php

$name = $_POST["name"];
$score = $_POST["score"];
$difficulty = $_POST["difficulty"];

$mysqli = new mysqli("localhost", "root", "", "memrun");

if ( $difficulty == 0 )
	$query = "INSERT INTO high_scores_easy (id, name, score) VALUES (NULL, '$name', '$score');";
else
	$query = "INSERT INTO high_scores_hard (id, name, score) VALUES (NULL, '$name', '$score');";
	
$mysqli->query($query);

?>