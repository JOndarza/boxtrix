using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BoxTrix.Api.Tests;

public sealed class OrganizeEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public OrganizeEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_organize_sort_returns_200_with_placed_boxes()
    {
        var payload = new
        {
            id = "smoke",
            areas = new[] { new { id = "shelf", width = 100, height = 50, depth = 40, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "a", width = 10, height = 10, depth = 10, weight = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_json);
        body.GetProperty("id").GetString().Should().Be("smoke");
        body.GetProperty("areas")[0].GetProperty("boxes")[0].GetProperty("id").GetString().Should().Be("a");
    }

    [Fact]
    public async Task Post_organize_sort_returns_400_for_missing_areas()
    {
        var payload = new
        {
            id = "bad",
            areas = Array.Empty<object>(),
            boxes = new[] { new { id = "a", width = 1.0, height = 1.0, depth = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Post_organize_sort_supports_BottomFrontRight_corner_via_string_enum()
    {
        var payload = new
        {
            id = "corner",
            areas = new[]
            {
                new
                {
                    id = "shelf",
                    width = 100, height = 50, depth = 40, x = 0, y = 0, z = 0,
                    accessCorner = "bottomFrontRight",
                },
            },
            boxes = new[] { new { id = "a", width = 20, height = 10, depth = 10, weight = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_json);
        var box = body.GetProperty("areas")[0].GetProperty("boxes")[0];
        box.GetProperty("position").GetProperty("x").GetDecimal().Should().Be(80m, "right corner anchors box at (100 - 20)");
    }

    [Fact]
    public async Task Boxes_that_do_not_fit_go_to_UNFITTED_virtual_area()
    {
        var payload = new
        {
            id = "unfitted",
            areas = new[] { new { id = "tiny", width = 5, height = 5, depth = 5, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "huge", width = 50, height = 50, depth = 50, weight = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_json);
        var areas = body.GetProperty("areas").EnumerateArray().ToArray();
        areas.Should().Contain(a => a.GetProperty("id").GetString() == "UNFITTED" && a.GetProperty("unplaced").GetBoolean());
    }

    [Fact]
    public async Task Returns_400_when_id_is_empty()
    {
        var payload = new
        {
            id = "",
            areas = new[] { new { id = "a", width = 10.0, height = 10.0, depth = 10.0, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "b", width = 1.0, height = 1.0, depth = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_box_dimension_is_negative()
    {
        var payload = new
        {
            id = "bad",
            areas = new[] { new { id = "a", width = 10.0, height = 10.0, depth = 10.0, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "b", width = -1.0, height = 1.0, depth = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_exit_corridor_extends_outside_area()
    {
        var payload = new
        {
            id = "corridor-oob",
            areas = new[]
            {
                new
                {
                    id = "shelf",
                    width = 100, height = 50, depth = 40, x = 0, y = 0, z = 0,
                    exitCorridor = new { x = 90, y = 0, z = 0, width = 50, height = 50, depth = 40 },
                },
            },
            boxes = new[] { new { id = "b", width = 1.0, height = 1.0, depth = 1.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Returns_400_when_min_support_ratio_is_above_one()
    {
        var payload = new
        {
            id = "ratio",
            areas = new[] { new { id = "a", width = 10.0, height = 10.0, depth = 10.0, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "b", width = 1.0, height = 1.0, depth = 1.0 } },
            constraints = new { minSupportRatio = 1.5 },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Box_with_zero_weight_is_accepted_as_boundary_case()
    {
        var payload = new
        {
            id = "zero-weight",
            areas = new[] { new { id = "a", width = 10.0, height = 10.0, depth = 10.0, x = 0, y = 0, z = 0 } },
            boxes = new[] { new { id = "b", width = 1.0, height = 1.0, depth = 1.0, weight = 0.0 } },
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Returns_400_when_boxes_array_is_empty()
    {
        var payload = new
        {
            id = "no-boxes",
            areas = new[] { new { id = "a", width = 10.0, height = 10.0, depth = 10.0, x = 0, y = 0, z = 0 } },
            boxes = Array.Empty<object>(),
        };

        var response = await _client.PostAsJsonAsync("/organize/sort", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
