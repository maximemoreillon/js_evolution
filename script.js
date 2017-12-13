var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var width = canvas.width;
var height = canvas.height;

var population;
var optimum;

init();



var reset_button = document.getElementById("reset_button");
reset_button.addEventListener("click",init);

setInterval(loop, 100);

function loop() {

  // Create gradient
  var gradient=context.createRadialGradient(optimum[0],optimum[1],5,optimum[0],optimum[1],250);

  gradient.addColorStop(0,"red");
  gradient.addColorStop(1,"white");

  // Fill with gradient
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // evolution step
  for(var chromosome_index=0; chromosome_index<population.chromosomes.length; chromosome_index++) {
    draw_chromosome(population.chromosomes[chromosome_index]);
    population.chromosomes[chromosome_index].fitness = -distance(population.chromosomes[chromosome_index].genes,optimum);
  }

  population.natural_selection();

  // display
  context.font = "15px Arial";
  context.fillStyle ="black";
  context.textAlign="left";
  context.textBaseline="Middle";
  context.fillText("Generation: " + population.generation,30,30);

}

function Chromosome(gene_count) {
  // Class for chromosome

  this.alive = true;
  this.genes = [];
  this.fitness = 0;

  this.mutation_factor = 10;
  this.initial_variance = 100;

  // Initialize genes randomly
  for(var gene_index = 0; gene_index < gene_count; gene_index ++) {
    this.genes[gene_index] = this.initial_variance * (2*Math.random()-1);
  }

  this.born_from = function(parent){
    // Chromosome has genes similar to its parents', but slightly mutated
    for(var gene_index = 0; gene_index < this.genes.length; gene_index ++) {
      this.genes[gene_index] = parent.genes[gene_index] + this.mutation_factor * randn_bm();
    }
  }
}

function Population(chromosome_count, chromosome_gene_count) {
  // Class for population of chromosomes

  this.chromosomes = [];

  this.min_fitness;
  this.max_fitness;
  this.mean_fitness;

  this.death_toll;
  this.generation = 0;

  // initialize Population
  for(var chromosome_index=0; chromosome_index<chromosome_count; chromosome_index++) {
    this.chromosomes[chromosome_index] = new Chromosome(chromosome_gene_count);
  }


  this.natural_selection = function() {
    // Select and breed fit chromosomes

    this.get_fitness_min_max();
    this.survival_of_the_fittest();
    this.offspring_of_the_fittest();
    this.generation ++;
  }

  this.survival_of_the_fittest = function() {
    this.death_toll = 0;

    for(var chromosome_index = 0; chromosome_index < this.chromosomes.length; chromosome_index ++) {

      // Determine survival probability
      var survival_probability = 0.0;
      if(this.min_fitness != this.max_fitness) {
        // Probability of survival depends on how creature compares to others
        survival_probability = map(this.chromosomes[chromosome_index].fitness, this.min_fitness, this.max_fitness,0.00,1.00);
      }
      else {
        survival_probability = 0.5;
      }

      // Select individuals with the highest survival probability
      if(survival_probability < Math.random()) {
        this.chromosomes[chromosome_index].alive = false;
        this.death_toll ++;
      }
    }
  }


  this.offspring_of_the_fittest = function() {
    // Replacing dead chromosomes with offspring of the survivors
    if(this.death_toll < this.chromosomes.length) {
      // Otherwise, the survivors reproduce: dead creatures get replaced with the offspring of random survivors
      for(var chromosome_index = 0; chromosome_index < this.chromosomes.length; chromosome_index ++) {
        if(!this.chromosomes[chromosome_index].alive) {

          var potential_parent;

          // keep looking for a parent if the selected one is dead or has been selected already
          do {
            var potential_parent_index = Math.round( (this.chromosomes.length-1) * Math.random() );
            potential_parent = this.chromosomes[potential_parent_index];
          }
          while(!potential_parent.alive);

          // If alive, the parent gets to breed
          this.chromosomes[chromosome_index].born_from(potential_parent);
        }
      }

      // Revive all chromosomes that were dead and reset everyone's fitness for the next generation (MIGHT NOT BE THE RIGHT PLACE FOR THIS)
      for(var chromosome_index = 0; chromosome_index < this.chromosomes.length; chromosome_index ++) {
        if(!this.chromosomes[chromosome_index].alive){
          this.chromosomes[chromosome_index].alive = true;
        }
        this.chromosomes[chromosome_index].fitness = 0;
      }
    }
    else {
      // If every chromosome died, re-initialize all of them randomly
      for(var chromosome_index = 0; chromosome_index < this.chromosomes.length; chromosome_index ++) {
        this.chromosomes[chromosome_index] = new Chromosome(this.chromosomes[chromosome_index].genes.length);
      }
    }
  }


  this.get_fitness_min_max = function() {
    // Gets the best, worst and mean fitness of the population

    this.min_fitness = this.chromosomes[0].fitness;
    this.max_fitness = this.chromosomes[0].fitness;
    this.mean_fitness = 0.0;

    for(var chromosome_index = 0; chromosome_index < this.chromosomes.length; chromosome_index ++) {

      // Max
      if(this.chromosomes[chromosome_index].fitness > this.max_fitness) {
        this.max_fitness = this.chromosomes[chromosome_index].fitness;
      }

      // Min
      if(this.chromosomes[chromosome_index].fitness < this.min_fitness) {
        this.min_fitness = this.chromosomes[chromosome_index].fitness;
      }

      // Mean
      this.mean_fitness += this.chromosomes[chromosome_index].fitness/this.chromosomes.length;
    }
  }

}

function init() {

  population = new Population(100, 2);

  // override initial_variance with canvas position
  for(var chromosome_index=0; chromosome_index<population.chromosomes.length; chromosome_index++) {
    population.chromosomes[chromosome_index].genes[0] = width*Math.random();
    population.chromosomes[chromosome_index].genes[1] = height*Math.random();
  }

  optimum = [width*Math.random(),height*Math.random()];
}


function draw_chromosome(chromosome) {
  var radius = 5;
  context.beginPath();
  context.arc(chromosome.genes[0],chromosome.genes[1],radius,0,2*Math.PI);
  context.lineWidth=1;
  context.strokeStyle="#000000";
  context.fillStyle = "black";
  context.fill();
  context.stroke();
}


// Misc functions

function map(val, oldLow, oldHigh, newLow, newHigh) {
  // Linear mapping
  return (val-oldLow)/(oldHigh-oldLow) * (newHigh-newLow) + newLow;
}


function randn_bm() {
  // Standard Normal variate using Box-Muller transform.
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function distance(p1, p2) {
  return Math.sqrt((p2[0]-p1[0])*(p2[0]-p1[0]) +  (p2[1]-p1[1])*(p2[1]-p1[1]));
}
