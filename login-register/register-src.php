<?php

include "register.php";

error_reporting(0);

$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "progreso";

$conn = mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);
if(!$conn){ die("no hay conexión: ".mysqli_connect_error());}
$firstname = $_POST["datanombre"];
$lastname = $_POST["dataapellido"];
$user = $_POST["datausername"];
$pass = $_POST["datapassword"];
$confirm_pass = $_POST["datapassword2"];
$correovalid = $_POST["dataemail"];
$keyregistvalid = $_POST["datakey"];

$firstaname_nospacio = trim($firstname);

$errorsiono = false;
$error01 = $error02 = $error03 = $error04 = $error05 = "";
if($pass != $confirm_pass){

    $error01 = 'Contraseña no coincide <br>';
    $errorsiono = true;
}
if (!filter_var($correovalid, FILTER_VALIDATE_EMAIL)) {
    $error02 =  'Correo no válido <br>';
    $errorsiono = true;
}
if (!preg_match("/^[a-zA-Z ]*$/",$firstname) || !preg_match("/^[a-zA-Z ]*$/",$lastname)) {
    $error03 = 'Nombre/Apellido no válido <br>';
    $errorsiono = true;
}
#if($errorsiono){
#    echo '<div class="alert alert-danger" role="alert">'.$error01.'<td>'.$error02.'</td><td>'.$error03.'</div>';

#}



$resultados = mysqli_query($conn, "SELECT * FROM code");
#$consulta = mysqli_fetch_array($resultados);
$verificarnoexiste = false;
$keyutilizado = false;



if($errorsiono){
    echo '<div class="alert alert-danger" role="alert">'.$error01.'<td>'.$error02.'</td><td>'.$error03.'</td><td>'.$error04.'</td><td>'.$error05.'</div>';

}
else{

    while ($consulta = mysqli_fetch_array($resultados)) {
        $todas[] = $consulta;
        if(($consulta['keyz'] == $keyregistvalid) && ($consulta['valid'] == 0)){
            $sql = "UPDATE code SET valid = '1' WHERE keyz = $keyregistvalid ";
            mysqli_query($conn ,$sql);
            $verificarnoexiste = true;
          
        }
        elseif(($consulta['keyz'] == $keyregistvalid) && ($consulta['valid'] == 1)){
    
            echo '<div class="alert alert-danger" role="alert">key ya utilizado</div>';
            $verificarnoexiste = true;
            $errorsiono = true;
        }
    
    }

    if(($consulta['keyz'] != $keyregistvalid) && ($verificarnoexiste == false)){
        echo '<div class="alert alert-danger" role="alert">key no existente</div>';
        $errorsiono = true;
    }
}





#$query = mysqli_query($conn, "SELECT * FROM usuarios WHERE usuario  = '".$nombre."' and password = '".$pass."'");
$nr = mysqli_num_rows($query);

if($nr == 1)
{
    echo "Bienvenido: ". $nombre;
    echo "<br><a href='logout.php'>salir</a>";
} else if ($nr == 0)
{
    header("Location: index.php?error=1");
    
}




/*
if(isset($_GET["fallo"]) && $_GET["fallo"] == 'true')
{
   $msg = "<div style='color:red' align='center'>Usuario o contraseña incorrecta </div>";
}
else{
    $msg = "";
}

*/
?>


