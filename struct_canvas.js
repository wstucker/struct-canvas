
class Struct {

    constructor(canvas) {
        // Data to be passed to function
        var names = ["foobar", "dst", "src", "vlan", "crc", "pkt_len"];
        var msbs = [127, 51, 43, 38, 37, 7];
        var lsbs = [52, 44, 39, 38, 8, 0];

        //var c = document.getElementById("myCanvas");
        canvas.width = window.innerWidth * 0.99;
        var pixels_per_bit = canvas.width / (Math.max.apply(null, msbs) + 1);

        var bit_rows_required = Math.ceil(Math.log10(Math.max.apply(null, msbs)));

        var struct_top = 0;

        var bit_font_height = 10;

        var bar_top = struct_top + bit_font_height * bit_rows_required;
        var bar_height = 30;

        var field_font_height = 14;
        var field_font_top = (bar_height / 2) + bar_top;

        // Readjust canvas height to make sure it fits
        // May not want to do this if this is just a function that gets applied to the same canvas
        canvas.height = bar_top + bar_height;

        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.rect(0, bar_top, canvas.width, bar_height);
        ctx.closePath();
        ctx.stroke();

        var last_box_x = 1;
        var required_padding = ctx.measureText("  ").width

        for (var i = 0; i < names.length; i++) {

            var txt = names[i];
            var actual_txt_width = ctx.measureText(txt).width + required_padding;
            var bit_width = msbs[i] - lsbs[i] + 1;
            var allowed_txt_width = pixels_per_bit * bit_width;

            if (actual_txt_width > allowed_txt_width) {
                txt = "*";
            }


            //var box_width = actual_txt_width;
            var box_width = allowed_txt_width;
            var x_start = last_box_x;
            var x_stop = x_start + box_width;
            var x_center = x_start + box_width / 2;
            last_box_x = x_stop;

            ctx.beginPath();
            ctx.font = field_font_height.toString().concat("px Arial");
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.rect(x_start + 1, bar_top + 1, box_width - 2, bar_height - 2);
            ctx.fillText(txt, x_center, field_font_top);
            ctx.closePath();
            ctx.stroke();

            var bit_row_bottom = bar_top;
            for (var bit_row = 0; bit_row < bit_rows_required; bit_row++) {

                var msb_text_align = "left";
                var msb_x = x_start + 2;
                if (msbs[i] == lsbs[i]) {
                    msb_text_align = "center";
                    msb_x = x_center;
                }

                // MSB
                var msb_str = msbs[i].toString();
                if (msb_str.length >= bit_row + 1) {
                    var msb_digit = msb_str.charAt(msb_str.length - bit_row - 1)
                    ctx.beginPath();
                    ctx.font = bit_font_height.toString().concat("px Arial");
                    ctx.textAlign = msb_text_align;
                    ctx.textBaseline = "bottom";
                    ctx.fillText(msb_digit, msb_x, bit_row_bottom);
                    ctx.closePath();
                    ctx.stroke();
                }

                if (msbs[i] != lsbs[i]) {
                    // LSB
                    var lsb_str = lsbs[i].toString();
                    if (lsb_str.length >= bit_row + 1) {
                        var lsb_digit = lsb_str.charAt(lsb_str.length - bit_row - 1)
                        ctx.beginPath();
                        ctx.font = bit_font_height.toString().concat("px Arial");
                        ctx.textAlign = "right";
                        ctx.textBaseline = "bottom";
                        ctx.fillText(lsb_digit, x_stop - 2, bit_row_bottom);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
                bit_row_bottom = bit_row_bottom - bit_font_height;

            }

        }
    }
}
