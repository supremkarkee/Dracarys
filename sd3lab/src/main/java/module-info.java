module com.example.sd3lab {
    requires javafx.controls;
    requires javafx.fxml;

    opens com.example.sd3lab to javafx.fxml;
    exports com.example.sd3lab;
}
