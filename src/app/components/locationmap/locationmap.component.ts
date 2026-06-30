/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @typescript-eslint/no-empty-function */
// import { Component, OnInit, ViewChild } from '@angular/core';
// import { GoogleMapsModule, MapMarker, MapInfoWindow } from '@angular/google-maps';
// import { NgFor } from '@angular/common';
import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { GoogleMapsModule, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-locationmap',
  templateUrl: './locationmap.component.html',
  styleUrls: ['./locationmap.component.css'],
  standalone :true,
  imports: [GoogleMapsModule, NgFor, MapMarker, MapInfoWindow , NgClass]
  
})
export class LocationmapComponent implements OnInit {
@ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
@ViewChildren(MapMarker) mapMarkers!: QueryList<MapMarker>;
  activeIndex: number | undefined;
 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() { }
  center: google.maps.LatLngLiteral = { lat: 10.5276, lng: 76.2144 };
zoom = 13;
selectedMarker:any;
markers:any[] = [];
 executiveVisits: any[] = [
    { executiveName: 'Sankar', latitude: 10.5276, longitude: 76.2144, customerName: 'Customer 1', collectedDate: '10:30 AM' },
    { executiveName: 'Sankar', latitude: 10.5321, longitude: 76.2089, customerName: 'Customer 2', collectedDate: '11:15 AM' },
    { executiveName: 'Sankar', latitude: 10.5150, longitude: 76.2200, customerName: 'Customer 3', collectedDate: '12:20 PM' },
    { executiveName: 'Sankar', latitude: 10.0100, longitude: 76.3490, customerName: 'Customer 4', collectedDate: '4:20 PM' },
    { executiveName: 'Sankar', latitude: 10.0143, longitude: 76.3098, customerName: 'Customer 5', collectedDate: '6:00 PM' },
  ];
ngOnInit() {
    this.markers = this.executiveVisits.map(item => ({
      position: { lat: item.latitude, lng: item.longitude },
      customerName: item.customerName,
      collectedDate: item.collectedDate,
      executiveName: item.executiveName,
    }));
  }

 
  // openInfo(markerRef: MapMarker, markerData: any) {
  //   this.selectedMarker = markerData;
  //   this.infoWindow.open(markerRef); 
  // }

  // Handle map pin click
  openInfo(markerRef: MapMarker, markerData: any) {
    this.selectedMarker = markerData;
    this.infoWindow.open(markerRef);
  }

  // Handle timeline click
  onTimelineClick(index: number) {
    this.activeIndex = index;
    const markerData = this.markers[index];
    
    // 1. Center the map on the clicked location
    this.center = { ...markerData.position };
    
    // 2. Extract the specific MapMarker reference from the QueryList
    const markerRef = this.mapMarkers.toArray()[index];
    
    // 3. Open the InfoWindow
    if (markerRef) {
      this.openInfo(markerRef, markerData);
    }
  }
  }

// ngAfterViewInit(){

// const map = new google.maps.Map(
//  document.getElementById('map') as HTMLElement,
//  {
//    center:{
//      lat:10.5276,
//      lng:76.2144
//    },
//    zoom:14
//  }
// );


// this.markers.forEach(item=>{


// const content = document.createElement("div");

// content.innerHTML = `
// <div class="marker-info">
//    <div class="customer">
//       ${item.customerName}
//    </div>
//    <div class="time">
//       ${item.time}
//    </div>
// </div>
// <img src="assets/images/user-marker.png" 
//      width="40">
// `;


// new google.maps.marker.AdvancedMarkerElement({

//  map:map,

//  position:{
//    lat:item.latitude,
//    lng:item.longitude
//  },

//  content:content

// });


// });


// }
// openInfo(marker:any){

// this.selectedMarker = marker;

// this.infoWindow.open();

// }

