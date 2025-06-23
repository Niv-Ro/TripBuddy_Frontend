'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// This is a presentational component for displaying statistical graphs.
const StatsGraphs = ({ statsData, loadingStats }) => {
    // Refs are used to get a direct reference to the DOM elements where D3 will draw the charts.
    const postsChartRef = useRef(null);
    const commentsChartRef = useRef(null);

    // This is the main function where all the D3 chart-drawing logic resides.
    const createChart = (container, data, title, color = '#007bff') => {
        // Step 1: Cleanup. Always remove the previous chart before drawing a new one to prevent duplicates.
        d3.select(container).selectAll("*").remove();

        // Safety check. If there's no data, display a simple message instead of a broken chart.
        if (!data || data.length === 0) {
            d3.select(container)
                .append('div')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .style('font-size', '14px')
                .text('No data available');
            return;
        }

        // Step 2: Define chart dimensions and margins. This is a standard D3 convention.
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Step 3: Create the main SVG element that will contain the chart.
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        // Create a group element ('g') and apply margins. The chart will be drawn inside this group.
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // A simple mapping to ensure data format is consistent.
        const formattedData = data.map((d, index) => ({
            day: d.day,
            count: d.count,
            index: index
        }));

        // Step 4: Define the scales. These are functions that map data values to pixel positions.
        // `scaleBand` is used for categorical data (like dates) on the x-axis.
        const x = d3.scaleBand()
            .domain(formattedData.map(d => d.day))
            .range([0, width])
            .padding(0.1);

        // `scaleLinear` is used for numerical data (like counts) on the y-axis.
        const y = d3.scaleLinear()
            .domain([0, d3.max(formattedData, d => d.count) || 1])
            .nice()
            .range([height, 0]);

        // Defines a function that knows how to draw a line based on the scaled data points.
        const line = d3.line()
            .x(d => x(d.day) + x.bandwidth() / 2) // Positions the point in the center of the band.
            .y(d => y(d.count))
            .curve(d3.curveMonotoneX); // Makes the line smooth and curved.

        // Step 5: Draw the axes by calling D3's axis components.
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)'); // Rotates the x-axis labels for readability.

        g.append('g')
            .call(d3.axisLeft(y).ticks(5)); // The .ticks(5) suggests about 5 ticks on the y-axis.

        // Add vertical grid lines for better readability.
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(-height).tickFormat(''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Add horizontal grid lines.
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Draw the main line path, but only if there is more than one point.
        if (formattedData.length > 1) {
            g.append('path')
                .datum(formattedData)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 3)
                .attr('d', line);
        }

        // The Data Join: Selects all '.dot' elements, binds data, and appends a 'circle' for each data point.
        g.selectAll('.dot')
            .data(formattedData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.day) + x.bandwidth() / 2)
            .attr('cy', d => y(d.count))
            .attr('r', 5)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            // Attach event listeners for the interactive tooltip.
            .on('mouseover', function(event, d) {
                // Creates a tooltip div on the fly.
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                // Animate the tooltip's appearance.
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`Day: ${d.day}<br/>Count: ${d.count}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');

                // Make the hovered dot slightly larger.
                d3.select(this).attr('r', 7);
            })
            .on('mouseout', function() {
                // Remove the tooltip and reset the dot size.
                d3.selectAll('.tooltip').remove();
                d3.select(this).attr('r', 5);
            });

        // Appends a text element to serve as the chart's main title.
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(title);

        // Appends a text element for the Y-axis label.
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 0 - (height / 2) - margin.top)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Count');

        // Appends a text element for the X-axis label.
        svg.append('text')
            .attr('transform', `translate(${(width / 2) + margin.left}, ${height + margin.top + 40})`)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Day');
    };

    // This effect calls createChart for posts data when it becomes available.
    useEffect(() => {
        if (!loadingStats && postsChartRef.current) {
            createChart(postsChartRef.current, statsData.posts, 'Posts Over Time', '#007bff');
        }
    }, [statsData.posts, loadingStats]);

    // This effect does the same for the comments data.
    useEffect(() => {
        if (!loadingStats && commentsChartRef.current) {
            createChart(commentsChartRef.current, statsData.comments, 'Comments Over Time', '#28a745');
        }
    }, [statsData.comments, loadingStats]);

    // Shows a spinner while the parent component (StatsModal) is fetching and processing data.
    if (loadingStats) {
        return (
            <div className="text-center p-4">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading statistics...</p>
            </div>
        );
    }

    // The JSX that creates the containers for the charts and summary cards.
    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">📊 Posts Over Time</h6>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                        {/* This div is the container that the ref is attached to. D3 will draw the chart inside it. */}
                        <div ref={postsChartRef}></div>
                    </div>
                </div>
            </div>

            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header bg-success text-white">
                        <h6 className="mb-0">💬 Comments Over Time </h6>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                        <div ref={commentsChartRef}></div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="row">
                    <div className="col-6">
                        <div className="card bg-light border-primary">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <i className="fas fa-file-alt text-primary me-2" style={{fontSize: '24px'}}></i>
                                    <h5 className="card-title mb-0">Total Posts</h5>
                                </div>
                                <h2 className="text-primary mb-1">
                                    {statsData.posts ? statsData.posts.reduce((sum, item) => sum + item.count, 0) : 0}
                                </h2>

                            </div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="card bg-light border-success">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <i className="fas fa-comments text-success me-2" style={{fontSize: '24px'}}></i>
                                    <h5 className="card-title mb-0">Total Comments</h5>
                                </div>
                                <h2 className="text-success mb-1">
                                    {statsData.comments ? statsData.comments.reduce((sum, item) => sum + item.count, 0) : 0}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsGraphs;