import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { AreaClosed, Line, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { max, extent, bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import {  AxisLeft } from '@visx/axis';
import {
    Header
  } from "semantic-ui-react";
export const background = '#9f0000'; //'#3b6978';
export const background2 = '#9f0000'; //'#204051';
export const accentColor = '#edffea';
export const accentColorDark = '#ff7543'; //#75daad';
const tooltipStyles = {
    ...defaultStyles,
    background,
    border: '1px solid white',
    color: 'white',
};

// util
const formatDate = timeFormat("%b %d, %H:%m");

// accessors
const getDate = (d) => {
    return d.x;
}
const getCallActivity = (d) => {
    return d.y;
}







const ChartWithTooltip = (props) => {
    //const props = {data};
    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        tooltipOpen,
        showTooltip,
        hideTooltip,
    } = useTooltip();
    const width = 500;
    const height = 250;
    const navigate = useNavigate();
    let [searchParams, setSearchParams] = useSearchParams();
    // If you don't want to use a Portal, simply replace `TooltipInPortal` below with
    // `Tooltip` or `TooltipWithBounds` and remove `containerRef`
    const { containerRef, TooltipInPortal } = useTooltipInPortal({
        // use TooltipWithBounds
        detectBounds: true,
        // when tooltip containers are scrolled, this will correctly update the Tooltip position
        scroll: true,
    })
    const bisectDate = bisector((d) => d.x).left;

    const getMouseData = (event) => {
        const coords = localPoint(event.target.ownerSVGElement, event);
        const { x } = coords;

        const x0 = dateScale.invert(x);
        const index = bisectDate(calls, x0, 1);
        const d0 = calls[index - 1];
        const d1 = calls[index];
        let d = d0;
        if (d1 && getDate(d1)) {
            d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
        }

        return { data: d, coords }
    }
    const handleMouseClick = (event) => {
        const { data } = getMouseData(event);
        const timestamp = data.x.getTime();

        const params ={
            "filter-type": "talkgroups",
            "filter-code": props.tgNum,
            "time": timestamp
        }
        setSearchParams(params);
        props.navigate(props.tgNum, timestamp);
    }
    const handleMouseOver = (event, datum) => {
        const { coords, data } = getMouseData(event);
        showTooltip({
            tooltipLeft: coords.x,
            tooltipTop: callActivityScale(getCallActivity(data)),
            tooltipData: data
        });
    };
    // bounds
    const margin = { top: 10, right: 0, bottom: 0, left: 25 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const calls = useMemo(
        () => {
                let callTotals = []; 
                const now = new Date();
                var MS_PER_MINUTE = 60000;
            
                for (let j = 0; j < props.data.length; j++) {
                    let spotsBack = j;
                    let time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
                    callTotals.push({ y: props.data[j], x: time });
                }
                callTotals.sort((a,b) => a.x-b.x);
                return callTotals
            
            


        }, [props.data]
    );
    const dateScale = useMemo(
        () =>
            scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: extent(calls, getDate),
            }),
        [innerWidth, margin.left, calls],
    );

    const callActivityScale = useMemo(
        () => {
            return scaleLinear({
                range: [innerHeight + margin.top, margin.top],
                domain: [0, (max(calls, getCallActivity) || 0)], // + innerHeight / 3],
                nice: true,
            })
        },
        [margin.top, innerHeight, calls],
    );

    return (
        // Set `ref={containerRef}` on the element corresponding to the coordinate system that
        // `left/top` (passed to `TooltipInPortal`) are relative to.
        <div style={{ float: "left", margin: "15px"}}>
             <Header as='h3'>{props.tg}</Header>
             <div style={{position: 'relative'}}>
            <svg ref={containerRef} width={width} height={height} >
                
                <rect
                    x={margin.left}
                    y={0}
                    width={width-margin.left-margin.right}
                    height={height}
                    fill="url(#area-background-gradient)"
                    rx={14}
                />

                <LinearGradient id="area-background-gradient" from={background} to={background2} />
                <LinearGradient id="area-gradient" from={accentColor} to={accentColor} toOpacity={0.1} />
                <GridRows
                    left={margin.left}
                    scale={callActivityScale}
                    width={innerWidth}
                    strokeDasharray="1,3"
                    stroke={accentColor}
                    strokeOpacity={0}
                    pointerEvents="none"
                />
                <GridColumns
                    top={margin.top}
                    scale={dateScale}
                    height={innerHeight}
                    strokeDasharray="1,3"
                    stroke={accentColor}
                    strokeOpacity={0.2}
                    pointerEvents="none"
                />
                <AreaClosed
                    data={calls}
                    x={(d) => dateScale(getDate(d)) ?? 0}
                    y={(d) => callActivityScale(getCallActivity(d)) ?? 0}
                    yScale={callActivityScale}
                    strokeWidth={1}
                    stroke="url(#area-gradient)"
                    fill="url(#area-gradient)"
                    curve={curveMonotoneX}

                />
                <Bar
                    x={margin.left}
                    y={margin.top}
                    width={innerWidth}
                    height={innerHeight}
                    fill="transparent"
                    rx={14}
                    onMouseMove={handleMouseOver}
                    onMouseUp={handleMouseClick}
                    onMouseOut={hideTooltip}
                />
                <AxisLeft scale={callActivityScale} left={margin.left}  numTicks={2} hideAxisLine={true} hideZero={true} />
                {tooltipData && (
                    <g>
                        <Line
                            from={{ x: tooltipLeft, y: margin.top }}
                            to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                            stroke={accentColorDark}
                            strokeWidth={2}
                            pointerEvents="none"
                            strokeDasharray="5,2"
                        />
                        <circle
                            cx={tooltipLeft}
                            cy={tooltipTop + 1}
                            r={4}
                            fill="black"
                            fillOpacity={0.1}
                            stroke="black"
                            strokeOpacity={0.1}
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <circle
                            cx={tooltipLeft}
                            cy={tooltipTop}
                            r={4}
                            fill={accentColorDark}
                            stroke="white"
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                    </g>
                )}
            </svg>
            {tooltipOpen && (
                <div>
                    <TooltipWithBounds
                        key={Math.random()}
                        top={tooltipTop - 12}
                        left={tooltipLeft}
                        style={tooltipStyles}
                    >
                        {`${getCallActivity(tooltipData)}`}
                    </TooltipWithBounds>
                    <Tooltip
                        top={-28}
                        left={tooltipLeft}
                        style={{
                            ...defaultStyles,
                            minWidth: 72,
                            textAlign: 'center',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {formatDate(getDate(tooltipData))}
                    </Tooltip>
                </div>
            )}
            </div>
        </div>
    )
};

export default ChartWithTooltip;
/*
export default withTooltip(({
    width = 250,
    height = 250,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    showTooltip,
    hideTooltip,
    data,
    tooltipTop = 0,
    tooltipLeft = 0,
}) => {
    //if (width < 10) return null;

    // bounds
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const stock = buildData();
    const tooltipData = stock;
    // scales
    const dateScale = useMemo(
        () =>
            scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: extent(stock, getDate),
            }),
        [innerWidth, margin.left],
    );
    const stockValueScale = useMemo(
        () =>
            scaleLinear({
                range: [innerHeight + margin.top, margin.top],
                domain: [0, (max(stock, getStockValue) || 0) + innerHeight / 3],
                nice: true,
            }),
        [margin.top, innerHeight],
    );

    // tooltip handler
    const handleTooltip = useCallback(
        (event) => {
            const { x } = localPoint(event) || { x: 0 };
            const x0 = dateScale.invert(x);
            const index = bisectDate(stock, x0, 1);
            const d0 = stock[index - 1];
            const d1 = stock[index];
            let d = d0;
            if (d1 && getDate(d1)) {
                d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
            }
            showTooltip({
                tooltipData: d,
                tooltipLeft: x,
                tooltipTop: stockValueScale(getStockValue(d)),
            });
        },
        [showTooltip, stockValueScale, dateScale],
    );

    return (
        <div>
            <svg width={width} height={height}>
                <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="url(#area-background-gradient)"
                    rx={14}
                />
                <LinearGradient id="area-background-gradient" from={background} to={background2} />
                <LinearGradient id="area-gradient" from={accentColor} to={accentColor} toOpacity={0.1} />
                <GridRows
                    left={margin.left}
                    scale={stockValueScale}
                    width={innerWidth}
                    strokeDasharray="1,3"
                    stroke={accentColor}
                    strokeOpacity={0}
                    pointerEvents="none"
                />
                <GridColumns
                    top={margin.top}
                    scale={dateScale}
                    height={innerHeight}
                    strokeDasharray="1,3"
                    stroke={accentColor}
                    strokeOpacity={0.2}
                    pointerEvents="none"
                />
                <AreaClosed
                    data={stock}
                    x={(d) => dateScale(getDate(d)) ?? 0}
                    y={(d) => stockValueScale(getStockValue(d)) ?? 0}
                    yScale={stockValueScale}
                    strokeWidth={1}
                    stroke="url(#area-gradient)"
                    fill="url(#area-gradient)"
                    curve={curveMonotoneX}
                />
                <Bar
                    x={margin.left}
                    y={margin.top}
                    width={innerWidth}
                    height={innerHeight}
                    fill="transparent"
                    rx={14}
                    onTouchStart={handleTooltip}
                    onTouchMove={handleTooltip}
                    onMouseMove={handleTooltip}
                    onMouseLeave={() => hideTooltip()}
                />

                <g>
                    <Line
                        from={{ x: tooltipLeft, y: margin.top }}
                        to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                        stroke={accentColorDark}
                        strokeWidth={2}
                        pointerEvents="none"
                        strokeDasharray="5,2"
                    />
                    <circle
                        cx={tooltipLeft}
                        cy={tooltipTop + 1}
                        r={4}
                        fill="black"
                        fillOpacity={0.1}
                        stroke="black"
                        strokeOpacity={0.1}
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                    <circle
                        cx={tooltipLeft}
                        cy={tooltipTop}
                        r={4}
                        fill={accentColorDark}
                        stroke="white"
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                </g>

            </svg>

            <div>
                <TooltipWithBounds
                    key={Math.random()}
                    top={tooltipTop - 12}
                    left={tooltipLeft + 12}
                    style={tooltipStyles}
                >
                    {getStockValue(tooltipData)}
                </TooltipWithBounds>
                <Tooltip
                    top={innerHeight + margin.top - 14}
                    left={tooltipLeft}
                    style={{
                        ...defaultStyles,
                        minWidth: 72,
                        textAlign: 'center',
                        transform: 'translateX(-50%)',
                    }}
                >
                    {formatDate(getDate(tooltipData))}
                </Tooltip>
            </div>
            </div>
        </div>
    );
}
);
*/
