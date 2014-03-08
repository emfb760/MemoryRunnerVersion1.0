<?php

$file = $_POST['filename'];

if( file_exists($file) ) {
	$text = file_get_contents($file);
	echo preg_replace('/^.+\n/', '', $text);
}

?>