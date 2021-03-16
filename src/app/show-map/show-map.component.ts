import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { FeatureFlagsService } from '../feature-flags.service';
import { randomBytes } from 'crypto';

@Component({
  selector: 'app-show-map',
  templateUrl: './show-map.component.html',
  styleUrls: [
    './show-map.component.css',
    '../../assets/simple-line-icons/css/simple-line-icons.css'
  ]
})

export class ShowMapComponent implements OnInit {
  mapDisplay = '';
  dwarfText = '';
  selectedScenario = '';
  isLongLoading = false;
  qrCodeString = '';
  private baseURL = environment.appURL;
  private changedMapID = false;
  private changeScenarioOnly = false;
  private isLoading: boolean;
  private tmpDwarfText: string;
  private tmpSelectedScenario: string;
  private seed; // generates a random 32 bit unsigned int
  private maxRuns = 50; //universal limit to number of runs each generation is allowed.
  private seedrandom = require('seedrandom');
  private rand;
  private scenarios = [
    `Control`,
    `Dominate`,
    `Fool's Gold`,
    `Invade`,
    `Kill`,
    `Loot`,
    `Pillage`,
    `Plunder`,
    `Push`,
    `Salt the Earth`,
    `Smoke & Mirrors`
  ];
  private terrainPieces = [ //reference array for pre-defined items. Others culd be read in from Json file.
    new TerrainPiece(0, 40, 1, 'stone_wall'),
    new TerrainPiece(1, 40, 1, 'pond'),
    new TerrainPiece(2, 40, 1, 'house'),
    new TerrainPiece(3, 40, 1, 'tree'),
    new TerrainPiece(4, 40, 1, 'boulder'),
    new TerrainPiece(5, 40, 1, 'boulder2'),
    new TerrainPiece(6, 40, 1, 'boulder3'),
    new TerrainPiece(7, 40, 1, 'foliage'),
    new TerrainPiece(8, 40, 1, 'crop_field')
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private _featureFlags: FeatureFlagsService
  ) { }

  ngOnInit() {
    // update the displayed information whenever the queries are updated
    this.route.queryParams.subscribe(() => {
      if(this.changedMapID) {
        this.startSpinner();
      }
      // if setting the scenario fails, pick a new scenario
      if (!this.setScenarioFromQuery()) {
        this.switchScenario(true);
      }
      // if setting the map fails, pick a new map
      if (!this.setMapFromQuery()) {
        this.switchMap(true);
      }
    });
  }

  async startSpinner() {
    this.isLoading = true;
    await sleep(150);
    this.isLongLoading = this.isLoading;
  }

  onLoad() {
    this.isLoading = false;
    this.isLongLoading = this.isLoading;
    this.selectedScenario = this.tmpSelectedScenario;
    this.dwarfText = this.tmpDwarfText;
  }

  /**
   * Pick a random scenario and map and update the URL accordingly.
   */
  switchMapAndScenario() {
    this.router.navigate(['/app'], {
      queryParams: {
        s: this.switchScenario(false),
        map: this.switchMap(false)
      }
    });
    if (environment.featureFlags.mapCanvas) {
      this.genMap();
    }
  }

  /**
   * Pick a new random scenario ID.
   *
   * @param navigate Whether to update URL query parameters.
   *
   * @returns New scenario ID.
   */
  switchScenario(navigate: boolean): number {
    this.changeScenarioOnly = false;
    const oldScenarioID = parseInt(this.route.snapshot.queryParamMap.get('s'),10);
    let scenarioID = Math.floor(Math.random() * this.scenarios.length);
    while(scenarioID === oldScenarioID) {
      scenarioID = Math.floor(Math.random() * this.scenarios.length);
    }
    if (navigate) {
      // update the URL with the chosen information
      this.changeScenarioOnly = true;
      this.changedMapID = false;
      this.router.navigate(['/app'], { queryParams: { s: scenarioID }, queryParamsHandling: 'merge' });
    }
    return scenarioID;
  }

  /**
   * Pick a new random map ID.
   *
   * @param navigate Whether to update URL query parameters.
   *
   * @returns New map ID.
   */
  switchMap(navigate: boolean): string {
    const mapCount = 20;
    this.changeScenarioOnly = false;
    this.changedMapID = true;
    const oldMapID = this.route.snapshot.queryParamMap.get('map');
    let mapID = 'ed' + (Math.round(Math.random() * (mapCount - 1)) + 1);
    if(mapID === oldMapID) {
      mapID = 'ed' + (Math.round(Math.random() * (mapCount - 1)) + 1);
    }
    if (navigate) {
      // update the URL with the chosen information
      this.router.navigate(['/app'], { queryParams: { map: mapID }, queryParamsHandling: 'merge' });
    }
    return mapID;
  }

  /**
   * Set the scenario based on the current url query parameters.
   *
   * @returns False if scenario ID is invalid or does not exist.
   */
  setScenarioFromQuery(): boolean {
    // load the scenario ID
    const scenarioID = this.route.snapshot.queryParamMap.get('s');
    // check that the 'scenario' parameter exists
    if (!scenarioID) { return false; }
    this.tmpSelectedScenario = this.scenarios[scenarioID];
    // check that we have a valid scenario
    if (!this.tmpSelectedScenario) { return false; }
    if(this.changeScenarioOnly) { this.onLoad(); }
    return true;
  }

  /**
   * Set the map based on the current url query parameters.
   *
   * @returns False if map ID is invalid or does not exist.
   */
  setMapFromQuery(): boolean {
    // load the map ID
    const mapID = this.route.snapshot.queryParamMap.get('map');
    // check that the 'map' parameter exists
    if (!mapID) { return false; }
    if (mapID.startsWith('ed', 0)) {
      const mapNum = Number(mapID.replace('ed', ''));
      // check that we have a valid map number
      if (isNaN(mapNum) || mapNum < 1 || mapNum > 20) { return false; }
      this.mapDisplay = 'assets/img/maps/' + mapID + '.svg';
      this.tmpDwarfText = 'Lars\' Epic Dwarf map #' + mapNum;
    }
    else {
      // for now, any map ID that doesn't start with 'ed' (e.g. any map that isn't epic dwarf) is invalid
      return false;
    }
    return true;
  }

  /**
   * Sets the QR code string based on the current map, then opens a modal using the given template.
   *
   * @param modal - The modal HTML template.
   */
  openShareModal(modal: TemplateRef<NgbModal>) {
    this.qrCodeString = this.baseURL + this.router.url;
    this.modalService.open(modal, { ariaLabelledBy: 'shareModalTitle' });
  }

  /**
   * generates and prints a map with simpleGenerate, then prints the seed for debug pruposes.
   */
  genMap() {
    this.printMap(this.simpleGenerate(400, 600, 50, null, false, false), 400, 600, true);
    this.dwarfText = 'Map Seed: ' + this.seed;
  }

  //Generaton code starts here.

  /**
   * generate map encoding (Node[])
   *
   * @param mapHeight - height of the map (usually 400)
   * @param mapWidth - width of the map (usually 600)
   * @param edgeBoundary - distance from the map edge in which objects cannot spawn
   * @param resources - an array of numbers representing the available resources where index equals id
   * @param weighted - toggle weighted generation
   * @param seeded - toggle whether the function generates a new seed
   */
  simpleGenerate(mapHeight: number, mapWidth: number, edgeBoundary: number,
    resources: number[], weighted: boolean, seeded: boolean): Node[] {
    if (!seeded) {
      this.seed = Math.floor(Math.random() * 4294967296);
    }
    this.rand = this.seedrandom(this.seed);
    const numOfItems = this.terrainPieces.length;
    const boundScaling = 0.85; //this scales the bounding circle allowing object to overlap slightly.
    const nodes: Node[] = [];
    const runs = 0;
    let numOfNodes = Math.floor(this.rand() * 4) + 8; //designates number of terrain pieces with a max of 12 and min of 8.
    let numPiecesAvailable = 0;
    if (resources != null) {
      for (const n of resources) {
        numPiecesAvailable += n;
      }
      if (numOfNodes > numPiecesAvailable) {
        numOfNodes = numPiecesAvailable;
      }
    }
    while (nodes.length < numOfNodes && runs < this.maxRuns) {
      const item: TerrainPiece = this.selectTP(numOfItems, weighted, resources);
      const tempX = Math.floor(this.rand() * (mapWidth - edgeBoundary)) + edgeBoundary;
      const tempY = Math.floor(this.rand() * (mapHeight - edgeBoundary)) + edgeBoundary;
      if (!this.checkForOverlap(nodes, item, tempX, tempY)) {
        nodes.push(new Node(tempX, tempY, Math.floor(this.rand() * 2 * Math.PI), (item.radius * boundScaling), item));
        if (resources != null) {
          resources[item.id]--;
        }
      }
    }
    return nodes;
  }

  /**
   * Selects a random terrain piece
   *
   * @param numOfItems - the number of items in TerrainPieces
   * @param weighted - toggle whether the generation is weighted
   * @param resources - an array of numbers representing the available resources where index equals id
   * @returns a random TerrainPiece
   */
  selectTP(numOfItems: number, weighted: boolean, resources: number[]): TerrainPiece {
    let item: TerrainPiece = null;
    while (item == null) {
      item = this.terrainPieces[Math.floor(this.rand() * (numOfItems - 1))];
      if ((resources != null) && (resources[item.id] < 1)) {
        item = null;
      }
      if (weighted && item.weight < this.rand()) {
        item = null;
      }
    }
    return item;
  }

  /**
   *
   * @param nodes - an array of nodes to compare against
   * @param item - potential terrain piece to check for overlap
   * @param x - the x coordinate of the potential location
   * @param y - the y coordinate of the potential location
   * @returns - boolean to indicate whether there is any overlap
   */
  checkForOverlap(nodes: Node[], item: TerrainPiece, x: number, y: number): boolean {
    let overlap = false;
    for (let i = 0; i < nodes.length; i++) { //checks the temp bounding circle against existing node bounding circles.
      const circle = nodes[i];
      if (dist(circle.x, circle.y, x, y) < circle.radius + item.radius) {
        overlap = true;
        i = nodes.length;
      }
    }
    return overlap;
  }

  /**
   * this function takes a valid encoding and prints it to the canvas.
   *
   * @param encoding - this array of nodes represents the map
   * @param h - indicates the height of the map to be printed
   * @param w - indicated the width of the map to be printed
   * @param debug - indicates whether or not to print debug info (bounding circles and spawn pts)
   */
  printMap(encoding: Node[], h: number, w: number, debug: boolean) {
    const gridSpacing = 100; //could be a param later
    const canvas = document.getElementById('mapViewer') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.fillStyle = 'rgb(112,179,68)';
    ctx.strokeStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //code to draw grid
    for (let i = gridSpacing; i < w; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = gridSpacing; i < h; i += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    //code to draw items
    ctx.fillStyle = 'red';
    for (const p of encoding) {
      const img = new Image(0, 0);
      img.src = 'assets/img/svg_map_pieces/' + p.item.svg + '.svg';
      //TODO: add code to rotate images
      const scaleFactor = p.item.radius * 2;
      img.onload = () => { ctx.drawImage(img, p.x - p.item.radius, p.y - p.item.radius, scaleFactor, scaleFactor); };
      if (debug) {
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const dist = (x1: number, y1: number, x2: number, y2: number): number => {
  const a = x1 - x2;
  const b = y1 - y2;
  return Math.sqrt(a * a + b * b);
};

//represents a terrain piece and its circle boundary
class Node {
  public x: number;
  public y: number;
  public angle: number; // angle of rotation
  public radius: number; //might be able to remove this later as item.radius is a scaled version of this.
  public item: TerrainPiece;

  public constructor(x, y, angle, radius, item) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.radius = radius;
    this.item = item;
  }
}

//represents a single pre-defined piece of terrain.
class TerrainPiece {
  public id: number; //index in the terrainPieces array
  public radius: number; //radius of the bounding circle
  public weight: number; // beween 0 and 1
  public svg: string; //name of the svg image.

  public constructor(id: number, r: number, w: number, img: string) {
    this.id = id;
    this.radius = r;
    this.weight = w;
    this.svg = img;
  }
}

// may be used for groups of terrain pieces dow the line.
class Group {
  public weight: number;
  public radius: number;
  public items: number[]; //array of terrain piece ids.

  public constructor(w: number, r: number, i: any[]) {
    this.weight = w;
    this.radius = r;
    this.items = i;
  }
}
