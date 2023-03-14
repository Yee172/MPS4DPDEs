var N = 100;
var h = 1 / N;

var SWITCH_voxel = false;

var data = [ generate_points() ];

var layout = initialize();

var memorized_xy = [0, 0];

var config =
{
    scrollZoom: true,
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [ 'select2d', 'lasso2d', 'resetScale2d' ],
    modeBarButtonsToAdd:
    [
        {
            name: 'Back',
            icon: Plotly.Icons.home,
            click: function(gd) { window.location.href = 'index.html' }
        }
    ]
};

var myPlot = document.getElementById( 'web_Kimura_2d' );

Plotly.newPlot( myPlot, data, layout, config );

function f( a11, a22, theta )
{
    const delta = Math.PI / 4;
    const a11_sqrt = Math.sqrt( a11 );
    const a22_sqrt = Math.sqrt( a22 );
    const p1 = [ a11_sqrt * Math.cos( theta ), a22_sqrt * Math.sin( theta ) ];
    const p2 = [ a11_sqrt * Math.cos( theta + delta ), a22_sqrt * Math.sin( theta + delta ) ];
    const a = Math.sqrt( Math.pow( p1[ 0 ], 2 ) + Math.pow( p1[ 1 ], 2 ) );
    const b = Math.sqrt( Math.pow( p2[ 0 ], 2 ) + Math.pow( p2[ 1 ], 2 ) );
    const c = Math.sqrt( Math.pow( p1[ 0 ] - p2[ 0 ], 2 ) + Math.pow( p1[ 1 ] - p2[ 1 ], 2 ) );
    const s = ( a + b + c ) / 2;
    const r_square = ( s - a ) * ( s - b ) * ( s - c ) / s;
    return r_square;
}

function get_radius_of_inscribed_circle( a11, a22 )
{
    const search_number = 20;
    const delta = Math.PI / 4;
    if ( a11 > a22 )
    {
        var temp = a11;
        a11 = a22;
        a22 = temp;
    }
    const search_start = delta;
    const search_end = ( Math.PI - delta ) / 2;
    const d = ( search_end - search_start ) / search_number;
    var radius_square = f( a11, a22, search_start );
    for( var i = 1; i <= search_number; i++ )
    {
        radius_square = Math.min( radius_square, f( a11, a22, search_start + i * d ) );
    }
    return Math.sqrt( radius_square );
}

function get_ellipse( x, y )
{
    var ellipse_x = [];
    var ellipse_y = [];
    const approximation_number = 50;
    const A11 = x * ( 1 - x );
    const A22 = y * ( 1 - y );
    const A12 = - x * y;
    const a = 1;
    const b = - ( A11 + A22 );
    const c = A11 * A22 - Math.pow( A12, 2 );
    const Delta = Math.pow( b, 2 ) - 4 * a * c;
    const a11 = ( - b - Math.sqrt( Delta ) ) / ( 2 * a );
    const a22 = ( - b + Math.sqrt( Delta ) ) / ( 2 * a );
    var v = [ [ A12, A12 ], [ a11 - A11, a22 - A11 ] ];
    var vd = [ Math.sqrt( Math.pow( v[ 0 ][ 0 ], 2 ) + Math.pow( v[ 1 ][ 0 ], 2 ) ), Math.sqrt( Math.pow( v[ 0 ][ 1 ], 2 ) + Math.pow( v[ 1 ][ 1 ], 2 ) ) ];
    v[ 0 ][ 0 ] /= vd[ 0 ];
    v[ 1 ][ 0 ] /= vd[ 0 ];
    v[ 0 ][ 1 ] /= vd[ 1 ];
    v[ 1 ][ 1 ] /= vd[ 1 ];
    var l = [ Math.sqrt( a11 ), Math.sqrt( a22 ) ];
    const r = h / get_radius_of_inscribed_circle( a11, a22 );
    l[ 0 ] *= r;
    l[ 1 ] *= r;
    for( var i = 0; i <= approximation_number; i++ )
    {
        const t = i * Math.PI * 2 / approximation_number;
        const g = [ l[ 0 ] * Math.cos( t ), l[ 1 ] * Math.sin( t ) ];
        ellipse_x.push( x + v[ 0 ][ 0 ] * g[ 0 ] + v[ 0 ][ 1 ] * g[ 1 ] );
        ellipse_y.push( y + v[ 1 ][ 0 ] * g[ 0 ] + v[ 1 ][ 1 ] * g[ 1 ] );
    }
    const ellipse_data =
    {
        hoverinfo: 'text',
        x: ellipse_x,
        y: ellipse_y,
        line:
        {
            color: '#0FFF50'
        }
    };
    return ellipse_data;
}

function generate_points()
{
    const d2b_threshold = 0.25;
    const d2b = h * d2b_threshold; // distance to the boundary
    const start_value = d2b;
    const end_value = 1 - ( 1 + Math.sqrt( 2 ) ) * d2b;
    const d = ( end_value - start_value ) / N;
    var x = [];
    var y = [];
    x.push(start_value);
    y.push(start_value);
    for( var i = 1; i <= N; i++ )
    {
        x.push( start_value + i * d );
        y.push( start_value );
    }
    for( var i = 1; i <= N; i++ )
    {
        x.push( start_value );
        y.push( start_value + i * d );
    }
    for( var i = 1; i < N; i++ )
    {
        x.push( start_value + i * d );
        y.push( end_value - i * d );
    }
    const point_data =
    {
        mode: "markers",
        marker:
        {
            size: 4
        },
        hoverinfo: 'text',
        x: x,
        y: y
    };
    return point_data;
}

function clean_handler( data )
{
    while ( self.data.length > 1 )
    {
        Plotly.deleteTraces( myPlot, 1 );
    }
}

function show_handler( data )
{
    for( var i = 0; i < data.points.length; i++ )
    {
        if ( data.points[ i ].curveNumber > 0 )
        {
            break;
        }
        var x = data.points[ i ].x;
        var y = data.points[ i ].y;
        var index = data.points[ i ].pointNumber;
        if ( index < 3 * N )
        {
            clean_handler( data );
            Plotly.addTraces( myPlot, get_ellipse( x, y ) );
        }
    }
}

myPlot.on( 'plotly_hover', show_handler );
myPlot.on( 'plotly_click', show_handler );
// myPlot.on( 'plotly_unhover', clean_handler );

function initialize()
{
    const extend_ratio = 12;
    const extend_length = h * extend_ratio;
    var layout =
    {
        title: "<span style='color:#0FFF50'>&#9673;</span>Green: Searching Ellipse<br><span style='color:#500FFF'>&#9673;</span>Blue: Near Boundary Interior Point",
        hovermode: 'closest',
        xaxis:
        {
            range: [ - extend_length, 1 + extend_length ],
            autorange: false,
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        yaxis:
        {
            range: [ - extend_length, 1 + extend_length ],
            scaleanchor: 'x',
            scaleratio: 1,
            autorange: false,
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        shapes:
        [
            {
                type: 'path',
                xref: 'x',
                yref: 'y',
                path: 'M 0 0 L 0 1 L 1 0 Z',
                opacity: 0.2,
                fillcolor: 'gray',
            },
            {
                type: 'path',
                xref: 'x',
                yref: 'y',
                path: 'M 0 0 L 0 1 L 1 0 Z',
                line:
                {
                    color: 'black',
                    width: 0.5
                }
            },
            {
                type: 'rect',
                xref: 'x',
                yref: 'y',
                x0: - extend_length,
                y0: - extend_length,
                x1: 1 + extend_length,
                y1: 1 + extend_length,
                line:
                {
                    color: 'black',
                    width: 2
                }
            }
        ],
        height: 1000,
        autosize: true,
        showlegend: false,
        dragmode: 'pan',
        margin:
        {
            b: 0
        }
    };
    if ( SWITCH_voxel )
    {
        for( var i = 1; i < N + extend_ratio * 2; i++ )
        {
            layout.shapes.push(
                {
                    type: 'line',
                    xref: 'x',
                    yref: 'y',
                    x0: - extend_length + i * h,
                    y0: - extend_length,
                    x1: - extend_length + i * h,
                    y1: 1 + extend_length,
                    opacity: 0.5,
                    line:
                    {
                        color: 'gray',
                        width: 1
                    }
                }
            );
        }
        for( var i = 1; i < N + extend_ratio * 2; i++ )
        {
            layout.shapes.push(
                {
                    type: 'line',
                    xref: 'x',
                    yref: 'y',
                    x0: - extend_length,
                    y0: - extend_length + i * h,
                    x1: 1 + extend_length,
                    y1: - extend_length + i * h,
                    opacity: 0.5,
                    line:
                    {
                        color: 'gray',
                        width: 1
                    }
                }
            );
        }
    }
    return layout;
}
