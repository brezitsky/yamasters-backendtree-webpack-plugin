<?php
/**
* User: Gramen
* Data: 15.08.2017
* Time: 12:00
*/
if (!class_exists("YamFront")) {

	class YamFront {

		function __construct($ar = array()) {
			if (is_array($ar) && !empty($ar)) {
				foreach ($ar as $key => $value) {
					$this->$key = $value;
				}
			}

			if (!defined("SITE_TEMPLATE_PATH")) {
				$tmpPath = dirname(dirname(__DIR__));
				$tmpPath = str_replace($_SERVER["DOCUMENT_ROOT"], "", $tmpPath);
				$tmpPath .= "/";
				define("SITE_TEMPLATE_PATH", $tmpPath);
			}
		}

		public function phpInclude($path) {
			$inclPath  = $_SERVER["DOCUMENT_ROOT"].SITE_TEMPLATE_PATH.$path;

			if (file_exists($inclPath)) {
				require $inclPath;
			} else {
				$this->error[] = "Не удалось подключить файл ({$inclPath})";
			}
		}

		public function pr($ar, $check = true) {
			if ($_SERVER["REMOTE_ADDR"] !== "31.42.52.46" && $check) return;
			echo "<pre>";
			print_r($ar);
			echo "</pre>";
		}

		public function getJsonParams() {
			$this->mainJson = array(
				"template_path" => SITE_TEMPLATE_PATH,
				"googleRecaptcha" => array(
					"publicKey" => "6Lf23QsUAAAAAIxli3VYkB0rwU38kXVMZJpGRnUb",
					"secretKey" => "6Lf23QsUAAAAAEm-O111qPx9o8saJd0QQmYcaAfF",
				),
			);

			return json_encode($this->mainJson);
		}
	}
}

global $APPLICATION;

if (!is_object($APPLICATION->YamFront)) {
	$APPLICATION->YamFront = new YamFront(array());
}
?>
