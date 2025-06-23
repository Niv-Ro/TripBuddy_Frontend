
'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const StatsGraphs = ({ statsData, loadingStats }) => {
    const postsChartRef = useRef(null);
    const commentsChartRef = useRef(null);

    const createChart = (container, data, title, color = '#007bff') => {
        // Clear previous chart
        d3.select(container).selectAll("*").remove();

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

        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates manually instead of using d3.timeParse
        const formattedData = data.map((d, index) => ({
            day: d.day,
            count: d.count,
            index: index
        }));

        // Use simple ordinal scale for x-axis (month strings)
        const x = d3.scaleBand()
            .domain(formattedData.map(d => d.day))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(formattedData, d => d.count) || 1])
            .nice()
            .range([height, 0]);

        // Create line generator
        const line = d3.line()
            .x(d => x(d.day) + x.bandwidth() / 2) // Center of band
            .y(d => y(d.count))
            .curve(d3.curveMonotoneX);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickSize(-height)
                .tickFormat('')
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat('')
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Add the line
        if (formattedData.length > 1) {
            g.append('path')
                .datum(formattedData)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 3)
                .attr('d', line);
        }

        // Add dots
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
            .on('mouseover', function(event, d) {
                // Create tooltip
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

                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`Day: ${d.day}<br/>Count: ${d.count}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');

                d3.select(this).attr('r', 7);
            })
            .on('mouseout', function() {
                d3.selectAll('.tooltip').remove();
                d3.select(this).attr('r', 5);
            });

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(title);

        // Add axis labels
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', 0 - (height + margin.top + margin.bottom) / 2)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Count');

        svg.append('text')
            .attr('transform', `translate(${(width + margin.left + margin.right) / 2}, ${height + margin.top + margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Day');
    };

    useEffect(() => {
        if (!loadingStats && postsChartRef.current) {
            createChart(postsChartRef.current, statsData.posts, 'Posts Over Time', '#007bff');
        }
    }, [statsData.posts, loadingStats]);

    useEffect(() => {
        if (!loadingStats && commentsChartRef.current) {
            createChart(commentsChartRef.current, statsData.comments, 'Comments Over Time', '#28a745');
        }
    }, [statsData.comments, loadingStats]);

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

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">📊 Posts Over Time (Non-Group Posts)</h6>
                    </div>
                    <div className="card-body d-flex justify-content-center">
                        <div ref={postsChartRef}></div>
                    </div>
                </div>
            </div>

            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header bg-success text-white">
                        <h6 className="mb-0">💬 Comments Over Time (All Posts)</h6>
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
                                <small className="text-muted">Non-group posts only</small>
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
                                <small className="text-muted">All posts</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsGraphs;