import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { ShowMapComponent } from '../show-map.component';
import { Node } from '../../dynamic-map/dynamic-map';


@Component({
  selector: 'app-map-legend',
  templateUrl: './map-legend.component.html',
  styleUrls: ['./map-legend.component.css']
})
export class MapLegendComponent implements OnInit {
  @Input() mapNodes: Node[];
  @Input() showLegend: boolean;
  @Input() passNodes: () => void;
  @Output() getlegendNodes = new EventEmitter<void>();
  legend: Legend[];
  myMapNodes;
  printLegend;

  constructor(
    private showmapComponent: ShowMapComponent
  ) { }

  ngOnInit() {
    this.myMapNodes = this.showmapComponent.passNodes();
    this.legend = this.getNodes();
    this.printLegend = this.printMapLegend(this.legend, 400, 600);
  }

  emitmapNodes() {
    this.getlegendNodes.emit(this.printLegend);
  }

  /**
   * this function takes the array of mapNodes
   * and makes an array of Legend to print to canvas
   */
   getNodes() {
    const legendNodes: Legend[] = [];
    for (let n of this.myMapNodes) {
      legendNodes.push(new Legend(
        n.x,
        n.y,
        n.item.svg,
        n.height,
        n.radius,
        this.assignTerrainType(n.item.svg, n.height)
      ));
    }
    return legendNodes;
  }


  /**
   * this function takes the type and height of each Terrain Piece from the array of Legends
   * and returns the type of Terrain (Blocking, Difficult, Obstacle, Hill)
   *
   * this function will be replace with future restructuring
   */
  assignTerrainType(type: string, height: number) {
    if ( type === 'house' || type === 'wood_building') {
      return 'Blocking';
    } else if (type === 'crop_field' || type === 'pond') {
      return 'Difficult';
    } else if (type === 'hedge_wall' || type === 'hedge_wall2' || type === 'stone_wall' || type === 'wood_wall_1') {
      if (height >= 2) {
        return 'Blocking Terrain';
      } else if (height <= 1) {
        return 'Obstacle';
      };
    } else if (type === 'tree' || type === 'foliage') {
      if (height > 2) {
        return 'Blocking';
      } else if (height <= 2) {
        return 'Difficult';
      };
    } else if (type === 'boulder' || type === 'boulder2' || type === 'boulder3') {
      return 'Hill';
    };
  }



  /**
   * this function takes the array of 'legends' and prints them to the canvas.
   *
   * @param encoding - this array of legends taken from the map Nodes
   * @param h - indicates the height of the map to be printed
   * @param w - indicated the width of the map to be printed
   */
   printMapLegend(encoding: Legend[], h: number, w: number) {
    const lCanvas = document.getElementById('legendViewer') as HTMLCanvasElement;
    const lCtx = lCanvas.getContext('2d') as CanvasRenderingContext2D;
    lCtx.clearRect(0, 0, lCtx.canvas.width, lCtx.canvas.height);
    const width = this.showmapComponent.showWidth.nativeElement.offsetWidth;
    lCtx.canvas.width = width;
    lCtx.canvas.height = width * .66;
    lCtx.scale(width / w, width * .66 / h);

    //code to draw items
    for (const p of encoding) {
      const typeText = p.type;
      const itemText = p.item;
      const heightText = 'Height: ' + p.height;
      const textWidth = lCtx.measureText(itemText).width;
      lCtx.fillStyle = 'white';
      if(itemText === 'tree'){
        lCtx.fillRect((p.x-25), (p.y-27), textWidth+30, 40);
      }else if (itemText === 'pond'){
        lCtx.fillRect((p.x-25), (p.y-27), textWidth+25, 40);
      }else if (itemText === 'house'){
        lCtx.fillRect((p.x-25), (p.y-27), textWidth+20, 40);
      }else{
        lCtx.fillRect((p.x-25), (p.y-27), textWidth+17, 40);
      }

      lCtx.fillStyle = 'black';
      lCtx.fillText(typeText, (p.x - 22), (p.y - 16));
      lCtx.fillText(itemText, (p.x - 22), (p.y - 5));
      lCtx.fillText(heightText, (p.x - 22), (p.y + 7));
    }
  }

}


export class Legend {
  public x: number;
  public y: number;
  public item: string;
  public height: number;
  public radius: number;
  public type: string;

  public constructor(x, y, item, height, radius, type) {
    this.x = x;
    this.y = y;
    this.item = item;
    this.height = height;
    this.radius = radius;
    this.type = type;
  }
}


