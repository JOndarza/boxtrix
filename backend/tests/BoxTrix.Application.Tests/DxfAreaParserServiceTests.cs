using System.Text;
using BoxTrix.Application.Services;
using FluentAssertions;

namespace BoxTrix.Application.Tests;

public sealed class DxfAreaParserServiceTests
{
    private readonly DxfAreaParserService _sut = new();

    // ── DXF builder ───────────────────────────────────────────────────────────

    private static Stream BuildDxf(
        string layerName,
        bool closed,
        params (double x, double y)[] vertices)
    {
        var sb = new StringBuilder();
        sb.Append("0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n");
        // ACadSharp resolves entity layers via the document layer table.
        // Handles (group 5) on both the TABLE and each LAYER entry are required
        // for ACadSharp to register the layer and not fall back to "0".
        sb.Append("0\nSECTION\n2\nTABLES\n");
        sb.Append("0\nTABLE\n2\nLAYER\n5\n1\n70\n1\n");
        sb.Append($"0\nLAYER\n5\n2\n2\n{layerName}\n70\n0\n62\n7\n6\nContinuous\n");
        sb.Append("0\nENDTAB\n0\nENDSEC\n");
        sb.Append("0\nSECTION\n2\nENTITIES\n");
        sb.Append($"0\nLWPOLYLINE\n8\n{layerName}\n90\n{vertices.Length}\n70\n{(closed ? 1 : 0)}\n");
        foreach (var (x, y) in vertices)
            sb.Append($"10\n{x:G17}\n20\n{y:G17}\n");
        sb.Append("0\nENDSEC\n0\nEOF\n");
        return new MemoryStream(Encoding.UTF8.GetBytes(sb.ToString()));
    }

    private static Stream EmptyEntitiesDxf()
    {
        const string dxf = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n"
                         + "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n";
        return new MemoryStream(Encoding.UTF8.GetBytes(dxf));
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Closed_rectangle_returns_correct_width_and_depth()
    {
        var stream = BuildDxf("Bodega", closed: true,
            (0, 0), (400, 0), (400, 300), (0, 300));

        var result = _sut.Parse(stream, defaultHeight: 250m);

        result.Should().HaveCount(1);
        result[0].Width.Should().Be(400m);
        result[0].Depth.Should().Be(300m);
    }

    [Fact]
    public void Default_height_is_applied_to_result()
    {
        var stream = BuildDxf("A", closed: true, (0, 0), (100, 0), (100, 80), (0, 80));

        var result = _sut.Parse(stream, defaultHeight: 320m);

        result[0].Height.Should().Be(320m);
    }

    [Fact]
    public void Named_layer_becomes_area_name()
    {
        var stream = BuildDxf("Pasillo_norte", closed: true,
            (0, 0), (200, 0), (200, 100), (0, 100));

        var result = _sut.Parse(stream, defaultHeight: 240m);

        result[0].Name.Should().Be("Pasillo_norte");
    }

    [Fact]
    public void Default_layer_zero_falls_back_to_generated_name()
    {
        var stream = BuildDxf("0", closed: true, (0, 0), (100, 0), (100, 50), (0, 50));

        var result = _sut.Parse(stream, defaultHeight: 240m);

        result[0].Name.Should().Be("Area 1");
    }

    [Fact]
    public void Open_polyline_is_ignored()
    {
        var stream = BuildDxf("Room", closed: false, (0, 0), (100, 0), (100, 50), (0, 50));

        var result = _sut.Parse(stream, defaultHeight: 100m);

        result.Should().BeEmpty();
    }

    [Fact]
    public void Polyline_with_fewer_than_three_vertices_is_ignored()
    {
        var stream = BuildDxf("Room", closed: true, (0, 0), (100, 0));

        var result = _sut.Parse(stream, defaultHeight: 100m);

        result.Should().BeEmpty();
    }

    [Fact]
    public void File_with_no_entities_returns_empty_list()
    {
        var result = _sut.Parse(EmptyEntitiesDxf(), defaultHeight: 240m);

        result.Should().BeEmpty();
    }

    [Fact]
    public void Multiple_closed_polylines_all_detected()
    {
        var sb = new StringBuilder();
        sb.Append("0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n");
        sb.Append("0\nSECTION\n2\nENTITIES\n");
        foreach (var layer in new[] { "Room1", "Room2" })
        {
            sb.Append($"0\nLWPOLYLINE\n8\n{layer}\n90\n4\n70\n1\n");
            sb.Append("10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n80\n10\n0\n20\n80\n");
        }
        sb.Append("0\nENDSEC\n0\nEOF\n");
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(sb.ToString()));

        var result = _sut.Parse(stream, defaultHeight: 240m);

        result.Should().HaveCount(2);
    }
}
