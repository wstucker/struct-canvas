
class StructConfig {
    constructor() {
        // Reset the canvas width to maximum visible width
        this.resize_to_window_width = true;
        this.resize_to_window_width_scale = 0.95;
        // Size of MSB and LSB numbering font above struct bar in pixels
        this.xsb_font_height = 10;
        // Height of struct bar in pixels
        this.bar_height = 30;
        // Height in pixels of gap between two consecutive structs
        this.bar_spacer_height = 5;
        // Size of font of field names in pixels
        this.field_name_font_height = 14;
    }
}


class Struct {
    /**
     * canvas: element
     * data: list of dictionaries
             dictionary keys:
                field_names (mandatory) list of strings
                msbs        (mandatory) list of ints
                lsbs        (mandatory) list of ints
                label       (optional)  string: a brief label tot show up on left of bar
    */
    constructor(canvas, data, config) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.data = data;
        this.config = config;

        if (this.config.resize_to_window_width) {
            // There's probably a better way to do this
            this.canvas.width = window.innerWidth * this.config.resize_to_window_width_scale;
        }

        this.last_rendered_y = 0;
        this.max_msb = 0; // calculated in check_data
        this.label_width_px = 0;
        
        this.check_data();

        this.pixels_per_bit = (this.canvas.width - this.label_width_px) / (this.max_msb + 1);
        this.bit_rows_required = Math.ceil(Math.log10(this.max_msb));
        
        for (var i=0; i < data.length ; i++) {
            this.render_struct(data[i]);
        }

        // Readjust canvas height to make sure it fits
        // May not want to do this if this is just a function that gets applied to the same canvas
        this.canvas.height = this.last_rendered_y;

        // Need to rerender because the resize right above wipes everythign out
        // FIXME, maybe in the previous render, can skip render and just to calculations
        this.last_rendered_y = 0;
        for (var i=0; i < data.length ; i++) {
            this.render_struct(data[i]);
        }
    }

    error(msg) {
        // FIMXE bettter way to render these errors?
        window.alert(msg)
    }

    check_data() {
        // Also calculates max_msb
        if (this.data.lenth == 0) {
            this.error("data was empty");
        }
        var msb_set = new Set();
        var label_widths = new Array();
        this.ctx.font = this.config.field_name_font_height.toString().concat("px Arial");
        for (var i=0; i < this.data.length; i++) {
            var struct = this.data[i];
            if ((struct["field_names"].length != struct["msbs"].length) ||
                (struct["field_names"].length != struct["lsbs"].length)) {
                this.error("data[" + i + "] had inconsistent lengths");
            }
            msb_set.add(Math.max.apply(null, struct["msbs"]));
            if ("label" in struct) {
                label_widths.push(this.ctx.measureText(" " + struct["label"] + " ").width);
            }
        }
        if (label_widths.length) {
            this.label_width_px = Math.max.apply(null, label_widths);
        }

        if (msb_set.size != 1) {
            this.error("Each element in the data list should have the same maximum msb for prettiest alignment. Use seperate Struct objects for different width structs.");
        }
        for (var it = msb_set.values(), val= null; val=it.next().value; ) {
            this.max_msb = val;
            break;
        }
    }

    render_struct(struct) {
        var bar_top = this.last_rendered_y + this.config.xsb_font_height * this.bit_rows_required;

        var field_font_top = (this.config.bar_height / 2) + bar_top;

        this.ctx.beginPath();
        this.ctx.rect(this.label_width_px, bar_top, this.canvas.width, this.config.bar_height);
        if ("label" in struct) {
            this.ctx.font = this.config.field_name_font_height.toString().concat("px Arial");
            this.ctx.textAlign = "right";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(struct["label"] + " ", this.label_width_px, field_font_top);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        var last_box_x = this.label_width_px + 1;
        if ("offset_msb" in struct) {
            last_box_x = struct["offset_msb"] * this.pixels_per_bit;
        }
        
        var required_padding = this.ctx.measureText("  ").width

        for (var i = 0; i < struct["field_names"].length; i++) {
            var txt = struct["field_names"][i];
            var actual_txt_width = this.ctx.measureText(txt).width + required_padding;
            var bit_width = struct["msbs"][i] - struct["lsbs"][i] + 1;
            var allowed_txt_width = this.pixels_per_bit * bit_width;

            if (actual_txt_width > allowed_txt_width) {
                txt = "*";
                // FIXME need to make a legend at the bottom?
            }

            var box_width = allowed_txt_width;
            var x_start = last_box_x;
            var x_stop = x_start + box_width;
            var x_center = x_start + box_width / 2;
            last_box_x = x_stop;

            this.ctx.beginPath();
            this.ctx.font = this.config.field_name_font_height.toString().concat("px Arial");
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            if (txt != "") {
                this.ctx.rect(x_start + 1, bar_top + 1, box_width - 2, this.config.bar_height - 2);
            }
            this.ctx.fillText(txt, x_center, field_font_top);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.font = this.config.xsb_font_height.toString().concat("px Arial");
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "bottom";
            var bit_row_bottom = bar_top;
            for (var bit_row = 0; bit_row < this.bit_rows_required; bit_row++) {

                var msb_text_align = "left";
                var msb_x = x_start + this.pixels_per_bit / 2;
                if (struct["msbs"][i] == struct["lsbs"][i]) {
                    msb_x = x_center;
                }

                // MSB
                var msb_str = struct["msbs"][i].toString();
                if (msb_str.length >= bit_row + 1) {
                    var msb_digit = msb_str.charAt(msb_str.length - bit_row - 1)
                    this.ctx.fillText(msb_digit, msb_x, bit_row_bottom);
                }

                if (struct["msbs"][i] != struct["lsbs"][i]) {
                    // LSB
                    var lsb_str = struct["lsbs"][i].toString();
                    if (lsb_str.length >= bit_row + 1) {
                        var lsb_digit = lsb_str.charAt(lsb_str.length - bit_row - 1)
                        this.ctx.fillText(lsb_digit, x_stop - (this.pixels_per_bit / 2), bit_row_bottom);
                    }
                }
                bit_row_bottom = bit_row_bottom - this.config.xsb_font_height;

            }
            this.ctx.closePath();
            this.ctx.stroke();

        }
        this.last_rendered_y = bar_top + this.config.bar_height + this.config.bar_spacer_height;
    }
}
