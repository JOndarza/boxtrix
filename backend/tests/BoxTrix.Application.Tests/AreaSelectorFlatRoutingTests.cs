using BoxTrix.Application;
using BoxTrix.Application.Pipeline;
using BoxTrix.Domain.Enums;
using BoxTrix.Domain.ValueObjects;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BoxTrix.Application.Tests;

/// <summary>
/// Verifies that the two-phase AreaSelector routes flat items to shallow areas
/// instead of letting the main shelf claim everything via plain FFD.
/// </summary>
public sealed class AreaSelectorFlatRoutingTests
{
    private readonly IPacker _packer;

    public AreaSelectorFlatRoutingTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBoxTrixApplication();
        _packer = services.BuildServiceProvider().GetRequiredService<IPacker>();
    }

    [Fact]
    public void Flat_items_are_routed_to_shallow_area_not_main_shelf()
    {
        // Main shelf: 120×40×35 — tall, processed in phase 2
        // Flat drawer: 80×12×50 — height ≤ 20 cm threshold, processed in phase 1
        var request = new PipelineRequest(
            "test", null,
            [
                Area("Main Shelf", 120, 40, 35),
                Area("Flat Drawer",  80, 12, 50),
            ],
            [
                // Comics: min dim = 1 cm — qualifies as flat (1 ≤ 12 × 0.7 = 8.4)
                Box("Comic-1", 17, 26, 1, weight: 0.15),
                Box("Comic-2", 17, 26, 1, weight: 0.15),
                Box("Comic-3", 17, 26, 1, weight: 0.15),
                // Funkos: min dim = 10 cm — does NOT qualify (10 > 8.4)
                Box("Funko-1", 14, 19, 10, weight: 0.30),
                Box("Funko-2", 14, 19, 10, weight: 0.30),
            ],
            Options());

        var response = _packer.Pack(request);

        var drawer = response.Areas.Single(a => a.Id == "Flat Drawer" && !a.Unplaced);
        var shelf  = response.Areas.Single(a => a.Id == "Main Shelf"  && !a.Unplaced);

        drawer.Boxes.Should().OnlyContain(b => b.Id.StartsWith("Comic"),
            "only flat items (min dim ≤ 8.4 cm) should enter the flat drawer");
        shelf.Boxes.Should().OnlyContain(b => b.Id.StartsWith("Funko"),
            "Funkos (min dim 10 cm) must not enter the flat drawer and should land in the shelf");
    }

    [Fact]
    public void Flat_items_that_do_not_fit_in_shallow_area_fall_back_to_main_shelf()
    {
        // Drawer is tiny — only fits 1 comic
        var request = new PipelineRequest(
            "test", null,
            [
                Area("Main Shelf", 120, 40, 35),
                Area("Tiny Drawer", 20, 12, 2),
            ],
            [
                Box("Comic-1", 17, 26, 1, weight: 0.15),
                Box("Comic-2", 17, 26, 1, weight: 0.15),
                Box("Comic-3", 17, 26, 1, weight: 0.15),
            ],
            Options());

        var response = _packer.Pack(request);

        var allPlaced = response.Areas
            .Where(a => !a.Unplaced)
            .SelectMany(a => a.Boxes)
            .Select(b => b.Id)
            .ToHashSet();

        allPlaced.Should().Contain("Comic-1");
        allPlaced.Should().Contain("Comic-2");
        allPlaced.Should().Contain("Comic-3");
    }

    [Fact]
    public void Area_with_height_above_threshold_is_not_treated_as_flat()
    {
        // Both areas above 20 cm threshold → plain FFD, no phase-1 routing
        var request = new PipelineRequest(
            "test", null,
            [
                Area("Shelf-A", 100, 40, 30),
                Area("Shelf-B", 100, 25, 30),
            ],
            [
                Box("Box-1", 10, 20, 10, weight: 1.0),
                Box("Box-2", 10, 20, 10, weight: 1.0),
                Box("Box-3", 10, 5,  10, weight: 0.5),
            ],
            Options());

        var response = _packer.Pack(request);

        var placed = response.Areas.Where(a => !a.Unplaced).SelectMany(a => a.Boxes).Count();
        placed.Should().Be(3, "all items should be placed when both areas are tall");
    }

    private static RequestArea Area(string id, decimal w, decimal h, decimal d) =>
        new(id, null, null,
            new DecimalMeasurements(w, h, d),
            new DecimalPosition(0, 0, 0),
            Corner.BottomFrontLeft,
            ExitCorridor: null,
            MaxStackHeight: null);

    private static RequestBox Box(string id, decimal w, decimal h, decimal d, double weight) =>
        new(id, null, null, new DecimalMeasurements(w, h, d), weight);

    private static PackingOptions Options() =>
        new(Units.Cm, MinSupportRatio: 0.7);
}
