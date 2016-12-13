$(document).ready(function () {
    $('#radiobtn a').on('click', function () {
        var sel = $(this).data('title');
        var tog = $(this).data('toggle');
        $('#'+tog).prop('value', sel);

        $('a[data-toggle="'+tog+'"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('inactive');
        $('a[data-toggle="'+tog+'"][data-title="' + sel + '"]').removeClass('inactive').addClass('active');
    });
});