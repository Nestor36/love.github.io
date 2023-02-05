<?php

session_start();
unset ($_SESSION['datausername']);
session_destroy();

header("Location: index.php")


?>