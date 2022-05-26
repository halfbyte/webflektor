require 'sinatra'
require 'haml'
require_relative './config_file'
require 'json'

get "/" do
  haml :index
end

get "/screen.css" do
  content_type 'text/css', :charset => 'utf-8'
  sass :screen
end

get "/javascripts/game.js" do
  coffee :game
end

get "/level/*.json" do
  content_type 'application/json', :charset => 'utf-8'
  path = "levels/" + params[:splat].join + ".level"
  if (File.exist?(path))
    @data = ConfigFile.new(path).data
  else
    @data = {:error => 'File not found'}
  end
  @data.to_json
end