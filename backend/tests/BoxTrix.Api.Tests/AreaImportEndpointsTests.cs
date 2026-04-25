using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace BoxTrix.Api.Tests;

public sealed class AreaImportEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public AreaImportEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string BuildDxf(bool closed = true, string layer = "Room1")
    {
        var flag = closed ? 1 : 0;
        // Handles on TABLE and LAYER entries are required for ACadSharp to
        // register the layer in its internal table and resolve it on the entity.
        return "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n"
             + "0\nSECTION\n2\nTABLES\n"
             + $"0\nTABLE\n2\nLAYER\n5\n1\n70\n1\n"
             + $"0\nLAYER\n5\n2\n2\n{layer}\n70\n0\n62\n7\n6\nContinuous\n"
             + "0\nENDTAB\n0\nENDSEC\n"
             + "0\nSECTION\n2\nENTITIES\n"
             + $"0\nLWPOLYLINE\n8\n{layer}\n90\n4\n70\n{flag}\n"
             + "10\n0\n20\n0\n10\n400\n20\n0\n10\n400\n20\n300\n10\n0\n20\n300\n"
             + "0\nENDSEC\n0\nEOF\n";
    }

    private static MultipartFormDataContent DxfMultipart(string dxfContent, string defaultHeight)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(defaultHeight), "defaultHeight");
        var fileBytes = new ByteArrayContent(Encoding.UTF8.GetBytes(dxfContent));
        fileBytes.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
        form.Add(fileBytes, "file", "plan.dxf");
        return form;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Valid_dxf_returns_200_with_area_dimensions()
    {
        using var form = DxfMultipart(BuildDxf(), "250");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        var areas = JsonSerializer.Deserialize<JsonElement[]>(body, _json)!;
        areas.Should().HaveCount(1);
        areas[0].GetProperty("width").GetDecimal().Should().Be(400m);
        areas[0].GetProperty("depth").GetDecimal().Should().Be(300m);
        areas[0].GetProperty("height").GetDecimal().Should().Be(250m);
        areas[0].GetProperty("name").GetString().Should().Be("Room1");
    }

    [Fact]
    public async Task Missing_file_returns_400()
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent("240"), "defaultHeight");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DefaultHeight_zero_returns_400()
    {
        using var form = DxfMultipart(BuildDxf(), "0");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DefaultHeight_negative_returns_400()
    {
        using var form = DxfMultipart(BuildDxf(), "-50");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DefaultHeight_missing_returns_400()
    {
        var form = new MultipartFormDataContent();
        var fileBytes = new ByteArrayContent(Encoding.UTF8.GetBytes(BuildDxf()));
        fileBytes.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
        form.Add(fileBytes, "file", "plan.dxf");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Invalid_file_content_returns_400()
    {
        using var form = DxfMultipart("this is not a dxf file @@@@", "240");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Dxf_with_no_closed_polylines_returns_200_with_empty_list()
    {
        using var form = DxfMultipart(BuildDxf(closed: false), "240");

        var response = await _client.PostAsync("/areas/import-dxf", form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        var areas = JsonSerializer.Deserialize<JsonElement[]>(body, _json)!;
        areas.Should().BeEmpty();
    }

    [Fact]
    public async Task Json_body_instead_of_multipart_returns_4xx()
    {
        var content = new StringContent("{}", Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/areas/import-dxf", content);

        // ASP.NET Core rejects the wrong Content-Type before reaching the endpoint
        // handler, returning 415 UnsupportedMediaType.
        ((int)response.StatusCode).Should().BeInRange(400, 499);
    }
}
